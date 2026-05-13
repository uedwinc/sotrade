import { ethers } from "ethers";

import { getTradingEnvironment } from "@/lib/config";
import { saveExecutionRun } from "@/lib/execution-persistence";
import type {
  ExecutionErrorResponse,
  ExecutionPlanRequest,
  ExecutionPreviewOrder,
  ExecutionPreviewResponse,
  ExecutionSubmitResponse,
  MarketBias
} from "@/lib/domain";

interface SodexEnvelope<T> {
  code: number;
  error?: string;
  timestamp?: number;
  data?: T;
}

interface SodexResponseItem {
  code: number;
  clOrdID: string;
  error?: string;
  orderID?: number;
}

interface PerpsSymbol {
  id: number;
  name: string;
  tickSize: string;
  stepSize: string;
  minQuantity: string;
  minNotional: string;
  quantityPrecision?: number;
  pricePrecision?: number;
}

interface ParsedExecutionRequest {
  asset: "BTC";
  thesisBias: Exclude<MarketBias, "neutral">;
  entryPriceUsd: number;
  stopLossUsd: number;
  takeProfitUsd: number[];
  positionSizeBtc: number;
  copilotGeneratedAt?: string;
  copilotRunId?: string;
}

class ExecutionServiceError extends Error {
  code: string;
  status: number;
  retryable: boolean;
  details?: string[];

  constructor(
    code: string,
    status: number,
    retryable: boolean,
    message: string,
    details?: string[]
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.retryable = retryable;
    this.details = details;
  }
}

const PERPS_DOMAIN = {
  name: "futures",
  version: "1",
  chainId: 138565,
  verifyingContract: "0x0000000000000000000000000000000000000000"
} as const;

const PERPS_TYPES = {
  ExchangeAction: [
    { name: "payloadHash", type: "bytes32" },
    { name: "nonce", type: "uint64" }
  ]
} as const;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function asRecord(value: unknown) {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return null;
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function round(value: number, decimals = 8) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function decimalPlaces(step: string) {
  const parts = step.split(".");
  return parts[1]?.replace(/0+$/, "").length ?? 0;
}

function floorToStep(value: number, step: number) {
  return Math.floor(value / step) * step;
}

function floorToPrecision(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.floor(value * factor) / factor;
}

function normalizePrice(value: number, tickSize: number, precision: number) {
  return floorToPrecision(floorToStep(value, tickSize), precision);
}

function normalizeQuantity(value: number, stepSize: number, precision: number) {
  return floorToPrecision(floorToStep(value, stepSize), precision);
}

function formatDecimal(value: number, precision: number) {
  const fixed = value.toFixed(precision);
  return fixed.replace(/\.?0+$/, "");
}

function makeClOrdId(role: "entry" | "take_profit" | "stop_loss") {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `sotrade_${role}_${Date.now()}_${suffix}`.slice(0, 36);
}

function oppositeSide(bias: "long" | "short") {
  return bias === "long" ? 2 : 1;
}

function entrySide(bias: "long" | "short") {
  return bias === "long" ? 1 : 2;
}

function humanSide(side: number): "BUY" | "SELL" {
  return side === 1 ? "BUY" : "SELL";
}

function buildOrderPreview(
  role: "entry" | "take_profit" | "stop_loss",
  side: number,
  type: 1 | 2,
  timeInForce: 1 | 3,
  input: {
    clOrdID: string;
    quantity: string;
    price?: string;
    stopPrice?: string;
    reduceOnly: boolean;
  }
): ExecutionPreviewOrder {
  return {
    clOrdID: input.clOrdID,
    role,
    side: humanSide(side),
    type: type === 1 ? "LIMIT" : "MARKET",
    timeInForce: timeInForce === 1 ? "GTC" : "IOC",
    price: input.price,
    quantity: input.quantity,
    stopPrice: input.stopPrice,
    reduceOnly: input.reduceOnly
  };
}

function getExecutionCredentials() {
  const env = getTradingEnvironment();

  if (!env.accountId || !env.apiWalletAddress || !env.privateKey) {
    throw new ExecutionServiceError(
      "SODEX_CREDENTIALS_MISSING",
      500,
      false,
      "SoDEX testnet credentials are incomplete.",
      [
        "Set SODEX_ACCOUNT_ID in .env.local.",
        "Set SODEX_API_KEY_NAME if your registered SoDEX API key name differs from the signer address.",
        "Set SODEX_API_WALLET_ADDRESS in .env.local.",
        "Set SODEX_PRIVATE_KEY in .env.local."
      ]
    );
  }

  if (!env.perpsRestUrl) {
    throw new ExecutionServiceError(
      "SODEX_ENDPOINT_MISSING",
      500,
      false,
      "The SoDEX perps testnet endpoint is not configured."
    );
  }

  const accountId = Number(env.accountId);

  if (!Number.isInteger(accountId) || accountId <= 0) {
    throw new ExecutionServiceError(
      "SODEX_ACCOUNT_INVALID",
      500,
      false,
      "SODEX_ACCOUNT_ID must be a valid positive integer."
    );
  }

  return {
    accountId,
    apiKeyName: env.apiKeyName || env.apiWalletAddress,
    apiWalletAddress: env.apiWalletAddress,
    privateKey: env.privateKey,
    perpsRestUrl: env.perpsRestUrl
  };
}

async function fetchPerpsSymbol(): Promise<PerpsSymbol> {
  const { perpsRestUrl } = getExecutionCredentials();
  const url = `${perpsRestUrl}/markets/symbols?symbol=BTC-USD`;
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new ExecutionServiceError(
      "SODEX_SYMBOL_FETCH_FAILED",
      502,
      true,
      `SoDEX symbol lookup failed with HTTP ${response.status}.`
    );
  }

  const body = (await response.json()) as SodexEnvelope<unknown>;
  const list = Array.isArray(body.data) ? body.data : [];
  const candidate = list
    .map((entry) => {
      const record = asRecord(entry);

      if (!record) {
        return null;
      }

      return {
        id: asNumber(record.id),
        name: asString(record.name),
        tickSize: asString(record.tickSize),
        stepSize: asString(record.stepSize),
        minQuantity: asString(record.minQuantity),
        minNotional: asString(record.minNotional),
        quantityPrecision: asNumber(record.quantityPrecision) ?? undefined,
        pricePrecision: asNumber(record.pricePrecision) ?? undefined
      };
    })
    .find((entry) => entry?.id && entry.name === "BTC-USD");

  if (!candidate?.id || !candidate.tickSize || !candidate.stepSize) {
    throw new ExecutionServiceError(
      "SODEX_SYMBOL_UNAVAILABLE",
      502,
      true,
      "BTC-USD symbol metadata is unavailable from SoDEX testnet."
    );
  }

  return {
    id: candidate.id,
    name: "BTC-USD",
    tickSize: candidate.tickSize,
    stepSize: candidate.stepSize,
    minQuantity: candidate.minQuantity || "0",
    minNotional: candidate.minNotional || "0",
    quantityPrecision: candidate.quantityPrecision ?? decimalPlaces(candidate.stepSize),
    pricePrecision: candidate.pricePrecision ?? decimalPlaces(candidate.tickSize)
  };
}

function parseExecutionRequest(body: unknown): ParsedExecutionRequest {
  const record = asRecord(body);

  if (!record) {
    throw new ExecutionServiceError(
      "INVALID_REQUEST",
      400,
      false,
      "Execution request body must be a JSON object."
    );
  }

  const asset = asString(record.asset);
  const thesisBias = asString(record.thesisBias);
  const entryPriceUsd = asNumber(record.entryPriceUsd);
  const stopLossUsd = asNumber(record.stopLossUsd);
  const positionSizeBtc = asNumber(record.positionSizeBtc);
  const takeProfitUsd = Array.isArray(record.takeProfitUsd)
    ? record.takeProfitUsd
        .map((value) => asNumber(value))
        .filter((value): value is number => value !== null && value > 0)
    : [];

  if (asset !== "BTC") {
    throw new ExecutionServiceError(
      "INVALID_ASSET",
      400,
      false,
      "Only BTC execution is supported in this phase."
    );
  }

  if (thesisBias !== "long" && thesisBias !== "short") {
    throw new ExecutionServiceError(
      "INVALID_BIAS",
      400,
      false,
      "Execution requires a long or short Copilot bias."
    );
  }

  if (!entryPriceUsd || !stopLossUsd || !positionSizeBtc || takeProfitUsd.length === 0) {
    throw new ExecutionServiceError(
      "INVALID_PLAN",
      400,
      false,
      "Execution requires actionable entry, stop, take-profit, and position size values."
    );
  }

  return {
    asset: "BTC",
    thesisBias,
    entryPriceUsd,
    stopLossUsd,
    takeProfitUsd,
    positionSizeBtc,
    copilotGeneratedAt: asString(record.copilotGeneratedAt) || undefined,
    copilotRunId: asString(record.copilotRunId) || undefined
  };
}

function buildExecutionPreview(
  request: ParsedExecutionRequest,
  symbol: PerpsSymbol
): ExecutionPreviewResponse & {
  requestBody: {
    accountID: number;
    symbolID: number;
    orders: Array<Record<string, boolean | number | string>>;
  };
} {
  const credentials = getExecutionCredentials();
  const adjustments: string[] = [];
  const warnings: string[] = [];
  const tickSize = Number(symbol.tickSize);
  const stepSize = Number(symbol.stepSize);
  const minQuantity = Number(symbol.minQuantity);
  const minNotional = Number(symbol.minNotional);
  const pricePrecision = symbol.pricePrecision ?? decimalPlaces(symbol.tickSize);
  const quantityPrecision = symbol.quantityPrecision ?? decimalPlaces(symbol.stepSize);

  const normalizedEntry = normalizePrice(request.entryPriceUsd, tickSize, pricePrecision);
  const normalizedStop = normalizePrice(request.stopLossUsd, tickSize, pricePrecision);
  const normalizedTp = normalizePrice(
    request.takeProfitUsd[0],
    tickSize,
    pricePrecision
  );
  const normalizedQuantity = normalizeQuantity(
    request.positionSizeBtc,
    stepSize,
    quantityPrecision
  );

  if (normalizedEntry !== request.entryPriceUsd) {
    adjustments.push(`Entry price adjusted to SoDEX tick size: ${request.entryPriceUsd} -> ${normalizedEntry}.`);
  }

  if (normalizedStop !== request.stopLossUsd) {
    adjustments.push(`Stop loss adjusted to SoDEX tick size: ${request.stopLossUsd} -> ${normalizedStop}.`);
  }

  if (normalizedTp !== request.takeProfitUsd[0]) {
    adjustments.push(`Take-profit adjusted to SoDEX tick size: ${request.takeProfitUsd[0]} -> ${normalizedTp}.`);
  }

  if (normalizedQuantity !== request.positionSizeBtc) {
    adjustments.push(`Position size adjusted to SoDEX step size: ${request.positionSizeBtc} -> ${normalizedQuantity}.`);
  }

  if (normalizedQuantity <= 0 || normalizedQuantity < minQuantity) {
    throw new ExecutionServiceError(
      "INVALID_QUANTITY",
      400,
      false,
      "The Copilot position size is below the SoDEX minimum quantity after normalization.",
      [
        `Normalized quantity: ${normalizedQuantity}`,
        `Minimum quantity: ${symbol.minQuantity}`
      ]
    );
  }

  if (normalizedEntry * normalizedQuantity < minNotional) {
    throw new ExecutionServiceError(
      "INVALID_NOTIONAL",
      400,
      false,
      "The normalized entry order notional is below the SoDEX minimum notional.",
      [
        `Normalized notional: ${round(normalizedEntry * normalizedQuantity, 2)}`,
        `Minimum notional: ${symbol.minNotional}`
      ]
    );
  }

  if (request.thesisBias === "long") {
    if (!(normalizedStop < normalizedEntry && normalizedTp > normalizedEntry)) {
      throw new ExecutionServiceError(
        "INVALID_PRICE_RELATIONSHIP",
        400,
        false,
        "The long execution plan does not preserve valid entry, stop, and take-profit ordering after normalization."
      );
    }
  } else if (!(normalizedStop > normalizedEntry && normalizedTp < normalizedEntry)) {
    throw new ExecutionServiceError(
      "INVALID_PRICE_RELATIONSHIP",
      400,
      false,
      "The short execution plan does not preserve valid entry, stop, and take-profit ordering after normalization."
    );
  }

  const stopDistancePct = Math.abs(normalizedEntry - normalizedStop) / normalizedEntry;

  if (stopDistancePct < 0.0025) {
    warnings.push("Stop distance remains very tight after normalization and may be too sensitive for live execution.");
  }

  warnings.push("Execution uses SoDEX testnet perps with a bracket order plus attached market TP/SL stops.");
  warnings.push("This preview currently uses the first take-profit level from the Copilot plan for live bracket execution.");

  const entrySideCode = entrySide(request.thesisBias);
  const exitSideCode = oppositeSide(request.thesisBias);
  const quantityString = formatDecimal(normalizedQuantity, quantityPrecision);
  const entryPriceString = formatDecimal(normalizedEntry, pricePrecision);
  const stopPriceString = formatDecimal(normalizedStop, pricePrecision);
  const takeProfitString = formatDecimal(normalizedTp, pricePrecision);

  const entryOrder = {
    clOrdID: makeClOrdId("entry"),
    modifier: 3,
    side: entrySideCode,
    type: 1,
    timeInForce: 1,
    price: entryPriceString,
    quantity: quantityString,
    reduceOnly: false,
    positionSide: 1
  } satisfies Record<string, boolean | number | string>;

  const takeProfitOrder = {
    clOrdID: makeClOrdId("take_profit"),
    modifier: 4,
    side: exitSideCode,
    type: 2,
    timeInForce: 3,
    quantity: quantityString,
    stopPrice: takeProfitString,
    stopType: 2,
    triggerType: 2,
    reduceOnly: true,
    positionSide: 1
  } satisfies Record<string, boolean | number | string>;

  const stopLossOrder = {
    clOrdID: makeClOrdId("stop_loss"),
    modifier: 4,
    side: exitSideCode,
    type: 2,
    timeInForce: 3,
    quantity: quantityString,
    stopPrice: stopPriceString,
    stopType: 1,
    triggerType: 2,
    reduceOnly: true,
    positionSide: 1
  } satisfies Record<string, boolean | number | string>;

  return {
    environment: "testnet",
    symbol: {
      id: symbol.id,
      name: "BTC-USD",
      tickSize: symbol.tickSize,
      stepSize: symbol.stepSize,
      minQuantity: symbol.minQuantity,
      minNotional: symbol.minNotional
    },
    account: {
      accountId: credentials.accountId,
      apiWalletAddress: credentials.apiWalletAddress
    },
    adjustments,
    warnings,
    orders: [
      buildOrderPreview("entry", entrySideCode, 1, 1, {
        clOrdID: entryOrder.clOrdID,
        quantity: quantityString,
        price: entryPriceString,
        reduceOnly: false
      }),
      buildOrderPreview("take_profit", exitSideCode, 2, 3, {
        clOrdID: takeProfitOrder.clOrdID,
        quantity: quantityString,
        stopPrice: takeProfitString,
        reduceOnly: true
      }),
      buildOrderPreview("stop_loss", exitSideCode, 2, 3, {
        clOrdID: stopLossOrder.clOrdID,
        quantity: quantityString,
        stopPrice: stopPriceString,
        reduceOnly: true
      })
    ],
    requestBody: {
      accountID: credentials.accountId,
      symbolID: symbol.id,
      orders: [entryOrder, takeProfitOrder, stopLossOrder]
    }
  };
}

function buildSigningPayload(requestBody: {
  accountID: number;
  symbolID: number;
  orders: Array<Record<string, boolean | number | string>>;
}) {
  return {
    type: "newOrder",
    params: requestBody
  };
}

async function signPerpsPayload(payload: {
  accountID: number;
  symbolID: number;
  orders: Array<Record<string, boolean | number | string>>;
}) {
  const credentials = getExecutionCredentials();
  const wallet = new ethers.Wallet(credentials.privateKey);
  const nonce = Date.now();
  const payloadJson = JSON.stringify(buildSigningPayload(payload));
  const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(payloadJson));
  const signature = await wallet.signTypedData(PERPS_DOMAIN, PERPS_TYPES, {
    payloadHash,
    nonce
  });

  return {
    nonce: String(nonce),
    signature: `0x01${signature.slice(2)}`
  };
}

async function submitPerpsBracketOrder(input: {
  preview: ExecutionPreviewResponse & {
    requestBody: {
      accountID: number;
      symbolID: number;
      orders: Array<Record<string, boolean | number | string>>;
    };
  };
  request: ParsedExecutionRequest;
}) {
  const credentials = getExecutionCredentials();
  const signed = await signPerpsPayload(input.preview.requestBody);
  const response = await fetch(`${credentials.perpsRestUrl}/trade/orders`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": credentials.apiKeyName,
      "X-API-Sign": signed.signature,
      "X-API-Nonce": signed.nonce
    },
    body: JSON.stringify(input.preview.requestBody)
  });

  if (!response.ok) {
    throw new ExecutionServiceError(
      "SODEX_SUBMIT_FAILED",
      502,
      true,
      `SoDEX order submission failed with HTTP ${response.status}.`
    );
  }

  const body = (await response.json()) as SodexEnvelope<SodexResponseItem[]>;

  if (body.code !== 0) {
    throw new ExecutionServiceError(
      "SODEX_GATEWAY_REJECTED",
      400,
      false,
      "SoDEX rejected the signed execution payload.",
      [body.error ?? "Gateway returned a non-zero response code."]
    );
  }

  const submittedAt = new Date().toISOString();
  const execution: ExecutionSubmitResponse = {
    environment: "testnet",
    symbol: input.preview.symbol,
    account: input.preview.account,
    adjustments: input.preview.adjustments,
    warnings: input.preview.warnings,
    orders: input.preview.orders,
    submittedAt,
    nonce: signed.nonce,
    requestType: "newOrder",
    response: {
      code: body.code,
      error: body.error,
      timestamp: body.timestamp,
      data: Array.isArray(body.data)
        ? body.data.map((item) => ({
            code: item.code,
            clOrdID: item.clOrdID,
            error: item.error,
            orderID: item.orderID
          }))
        : undefined
    },
    persistence: {
      status: "skipped"
    }
  };

  const persistence = await saveExecutionRun({
    request: input.request,
    preview: input.preview,
    response: execution
  });

  return {
    ...execution,
    persistence
  };
}

export function parseExecutionPlanRequest(body: unknown) {
  return parseExecutionRequest(body);
}

export async function generateExecutionPreview(
  request: ParsedExecutionRequest
): Promise<ExecutionPreviewResponse & {
  requestBody: {
    accountID: number;
    symbolID: number;
    orders: Array<Record<string, boolean | number | string>>;
  };
}> {
  const symbol = await fetchPerpsSymbol();
  return buildExecutionPreview(request, symbol);
}

export async function submitExecutionPlan(request: ParsedExecutionRequest) {
  const preview = await generateExecutionPreview(request);
  return submitPerpsBracketOrder({
    preview,
    request
  });
}

export function toExecutionErrorResponse(
  error: unknown
): { status: number; body: ExecutionErrorResponse } {
  if (error instanceof SyntaxError) {
    return {
      status: 400,
      body: {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
          retryable: false,
          details: [error.message]
        }
      }
    };
  }

  if (error instanceof ExecutionServiceError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
          details: error.details
        }
      }
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "The SoDEX execution request failed unexpectedly.",
        retryable: false,
        details: [getErrorMessage(error)]
      }
    }
  };
}
