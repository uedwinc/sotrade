import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

import { getBedrockEnvironment } from "@/lib/config";
import { saveCopilotRun } from "@/lib/copilot-persistence";
import type {
  CopilotErrorResponse,
  CopilotModelInfo,
  CopilotRequest,
  CopilotResponse,
  CopilotSizing,
  CopilotThesis,
  CopilotTradePlan,
  MarketBias,
  NormalizedSignal
} from "@/lib/domain";
import { getMarketSignalSnapshot } from "@/lib/market-signals";
import { getBtcSpotPriceAnchor } from "@/lib/btc-price";

interface ModelTradePlanOutput {
  thesis: CopilotThesis;
  tradePlan: CopilotTradePlan;
}

declare global {
  // eslint-disable-next-line no-var
  var sotradeBedrockClient: BedrockRuntimeClient | undefined;
}

class CopilotServiceError extends Error {
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function getBedrockClient() {
  const { region } = getBedrockEnvironment();

  if (!globalThis.sotradeBedrockClient) {
    globalThis.sotradeBedrockClient = new BedrockRuntimeClient({ region });
  }

  return globalThis.sotradeBedrockClient;
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

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toModelInfo(): CopilotModelInfo {
  const { modelId } = getBedrockEnvironment();

  return {
    provider: "bedrock",
    modelId
  };
}

function formatSignal(signal: NormalizedSignal) {
  return {
    kind: signal.kind,
    asset: signal.asset,
    title: signal.title,
    summary: signal.summary,
    bias: signal.bias,
    strength: signal.strength,
    evidence: signal.evidence,
    inference: signal.inference ?? null,
    observedAt: signal.observedAt
  };
}

function buildSystemPrompt() {
  return [
    "You are SoTrade Copilot, a crypto trading analyst embedded in a signal-to-trade app.",
    "Use only the supplied SoSoValue signals and the supplied BTC price anchor.",
    "Do not invent unseen market structure, technical levels, indicators, or macro facts.",
    "Your job is to decide whether there is an actionable BTC swing setup over the next 1 to 7 days.",
    "If conviction is weak or signals conflict, set actionable to false and bias to neutral if appropriate.",
    "If actionable is true, propose concrete numeric entry, stop loss, and 2 to 3 take-profit prices in USD.",
    "For long setups, stop loss must be below entry and take profits above entry.",
    "For short setups, stop loss must be above entry and take profits below entry.",
    "Return valid JSON only with the exact schema requested and no markdown fences."
  ].join(" ");
}

function buildSchemaExample() {
  return {
    thesis: {
      bias: "long | short | neutral",
      confidence: 0,
      summary: "short summary",
      rationale: ["bullet 1", "bullet 2"],
      risks: ["risk 1", "risk 2"]
    },
    tradePlan: {
      actionable: true,
      entryPriceUsd: 0,
      stopLossUsd: 0,
      takeProfitUsd: [0, 0],
      invalidation: "one sentence",
      executionNotes: ["note 1", "note 2"]
    }
  };
}

function buildUserPrompt(input: {
  request: CopilotRequest;
  spotPriceUsd: number;
  signalSnapshot: Awaited<ReturnType<typeof getMarketSignalSnapshot>>;
}) {
  return JSON.stringify(
    {
      task: "Generate a BTC swing trade thesis and structured trade plan.",
      outputRequirements: buildSchemaExample(),
      context: {
        asset: input.request.asset,
        horizon: input.request.horizon,
        accountEquityUsd: input.request.accountEquityUsd,
        maxRiskPct: input.request.maxRiskPct,
        spotPriceUsd: input.spotPriceUsd,
        signalSnapshot: {
          generatedAt: input.signalSnapshot.generatedAt,
          status: input.signalSnapshot.status,
          notes: input.signalSnapshot.notes,
          signals: input.signalSnapshot.signals.map(formatSignal)
        }
      },
      rules: [
        "Return JSON only.",
        "Use confidence from 0 to 100.",
        "If actionable is false, use null for entryPriceUsd and stopLossUsd, and use an empty takeProfitUsd array.",
        "Keep rationale and risks concise but specific.",
        "Reference the supplied signal evidence rather than generic market commentary."
      ]
    },
    null,
    2
  );
}

function extractJsonObject(text: string) {
  const trimmed = text.trim().replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Model response did not include a JSON object.");
  }

  return trimmed.slice(firstBrace, lastBrace + 1);
}

function parseBias(value: unknown): MarketBias {
  if (value === "long" || value === "short" || value === "neutral") {
    return value;
  }

  throw new Error("Model response included an invalid thesis bias.");
}

function parseStructuredOutput(text: string): ModelTradePlanOutput {
  const jsonText = extractJsonObject(text);
  const body = JSON.parse(jsonText) as unknown;
  const record = asRecord(body);

  if (!record) {
    throw new Error("Model response was not a JSON object.");
  }

  const thesisRecord = asRecord(record.thesis);
  const tradePlanRecord = asRecord(record.tradePlan);

  if (!thesisRecord || !tradePlanRecord) {
    throw new Error("Model response did not include thesis and tradePlan objects.");
  }

  const confidence = asNumber(thesisRecord.confidence);

  if (confidence === null) {
    throw new Error("Model response did not include a valid confidence value.");
  }

  const actionableValue = tradePlanRecord.actionable;

  if (typeof actionableValue !== "boolean") {
    throw new Error("Model response did not include a valid actionable flag.");
  }

  const takeProfitUsd = Array.isArray(tradePlanRecord.takeProfitUsd)
    ? tradePlanRecord.takeProfitUsd
        .map((entry) => asNumber(entry))
        .filter((entry): entry is number => entry !== null && entry > 0)
    : [];

  const entryPriceUsd = tradePlanRecord.entryPriceUsd === null
    ? null
    : asNumber(tradePlanRecord.entryPriceUsd);
  const stopLossUsd = tradePlanRecord.stopLossUsd === null
    ? null
    : asNumber(tradePlanRecord.stopLossUsd);
  const summary = asString(thesisRecord.summary);
  const invalidation = asString(tradePlanRecord.invalidation);

  if (!summary) {
    throw new Error("Model response did not include a valid thesis summary.");
  }

  if (!invalidation) {
    throw new Error("Model response did not include a valid invalidation statement.");
  }

  return {
    thesis: {
      bias: parseBias(thesisRecord.bias),
      confidence: Math.max(0, Math.min(100, round(confidence, 1))),
      summary,
      rationale: asStringArray(thesisRecord.rationale).slice(0, 5),
      risks: asStringArray(thesisRecord.risks).slice(0, 5)
    },
    tradePlan: {
      actionable: actionableValue,
      entryPriceUsd: entryPriceUsd && entryPriceUsd > 0 ? round(entryPriceUsd, 2) : null,
      stopLossUsd: stopLossUsd && stopLossUsd > 0 ? round(stopLossUsd, 2) : null,
      takeProfitUsd: takeProfitUsd.slice(0, 3).map((entry) => round(entry, 2)),
      invalidation,
      executionNotes: asStringArray(tradePlanRecord.executionNotes).slice(0, 5)
    }
  };
}

async function invokeBedrockText(userPrompt: string) {
  const client = getBedrockClient();
  const { modelId } = getBedrockEnvironment();
  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1400,
      temperature: 0.2,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            }
          ]
        }
      ]
    })
  });

  try {
    const response = await client.send(command);
    const decoded = new TextDecoder().decode(response.body);
    const body = JSON.parse(decoded) as {
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    };
    const text = (body.content ?? [])
      .filter((entry) => entry.type === "text")
      .map((entry) => entry.text ?? "")
      .join("\n")
      .trim();

    if (!text) {
      throw new Error("Bedrock response did not include text content.");
    }

    return text;
  } catch (error) {
    throw new CopilotServiceError(
      "BEDROCK_REQUEST_FAILED",
      502,
      true,
      "Bedrock could not generate a Copilot response.",
      [getErrorMessage(error)]
    );
  }
}

async function generateStructuredOutput(input: {
  request: CopilotRequest;
  spotPriceUsd: number;
  signalSnapshot: Awaited<ReturnType<typeof getMarketSignalSnapshot>>;
}) {
  const firstResponse = await invokeBedrockText(buildUserPrompt(input));

  try {
    return parseStructuredOutput(firstResponse);
  } catch (firstError) {
    const repairPrompt = JSON.stringify(
      {
        task: "Repair the previous Copilot response into valid JSON only.",
        schema: buildSchemaExample(),
        previousResponse: firstResponse,
        rules: [
          "Return valid JSON only.",
          "Do not add commentary.",
          "Preserve the original intent if possible."
        ]
      },
      null,
      2
    );

    const repairedResponse = await invokeBedrockText(repairPrompt);

    try {
      return parseStructuredOutput(repairedResponse);
    } catch (repairError) {
      throw new CopilotServiceError(
        "MODEL_OUTPUT_INVALID",
        502,
        true,
        "Bedrock returned an invalid Copilot payload after one repair attempt.",
        [getErrorMessage(firstError), getErrorMessage(repairError)]
      );
    }
  }
}

function normalizeTradePlan(
  thesis: CopilotThesis,
  tradePlan: CopilotTradePlan
): CopilotTradePlan {
  const executionNotes = [...tradePlan.executionNotes];
  let actionable = tradePlan.actionable;
  let entryPriceUsd = tradePlan.entryPriceUsd;
  let stopLossUsd = tradePlan.stopLossUsd;
  let takeProfitUsd = [...tradePlan.takeProfitUsd];

  if (thesis.bias === "neutral") {
    actionable = false;
    executionNotes.unshift("Signal posture is neutral, so the Copilot is withholding execution.");
  }

  if (!actionable) {
    return {
      ...tradePlan,
      actionable: false,
      entryPriceUsd: null,
      stopLossUsd: null,
      takeProfitUsd: [],
      executionNotes
    };
  }

  if (!entryPriceUsd || !stopLossUsd || takeProfitUsd.length === 0) {
    executionNotes.unshift("Actionable levels were incomplete, so the plan was downgraded to no-trade.");

    return {
      ...tradePlan,
      actionable: false,
      entryPriceUsd: null,
      stopLossUsd: null,
      takeProfitUsd: [],
      executionNotes
    };
  }

  if (thesis.bias === "long") {
    takeProfitUsd = takeProfitUsd.filter((entry) => entry > entryPriceUsd).sort((left, right) => left - right);

    if (!(stopLossUsd < entryPriceUsd) || takeProfitUsd.length === 0) {
      executionNotes.unshift("Long setup price relationships were invalid, so the plan was downgraded to no-trade.");
      actionable = false;
    }
  }

  if (thesis.bias === "short") {
    takeProfitUsd = takeProfitUsd.filter((entry) => entry < entryPriceUsd).sort((left, right) => right - left);

    if (!(stopLossUsd > entryPriceUsd) || takeProfitUsd.length === 0) {
      executionNotes.unshift("Short setup price relationships were invalid, so the plan was downgraded to no-trade.");
      actionable = false;
    }
  }

  const stopDistancePct = Math.abs(entryPriceUsd - stopLossUsd) / entryPriceUsd;

  if (stopDistancePct < 0.0025) {
    executionNotes.unshift("Stop distance was too tight to size safely, so the plan was downgraded to no-trade.");
    actionable = false;
  }

  if (!actionable) {
    entryPriceUsd = null;
    stopLossUsd = null;
    takeProfitUsd = [];
  }

  return {
    ...tradePlan,
    actionable,
    entryPriceUsd,
    stopLossUsd,
    takeProfitUsd,
    executionNotes
  };
}

function calculateSizing(
  request: CopilotRequest,
  tradePlan: CopilotTradePlan
): CopilotSizing {
  const riskUsd = round(request.accountEquityUsd * (request.maxRiskPct / 100), 2);

  if (!tradePlan.actionable || tradePlan.entryPriceUsd === null || tradePlan.stopLossUsd === null) {
    return {
      accountEquityUsd: request.accountEquityUsd,
      maxRiskPct: request.maxRiskPct,
      riskUsd,
      stopDistanceUsd: null,
      stopDistancePct: null,
      positionSizeBtc: null,
      positionNotionalUsd: null
    };
  }

  const stopDistanceUsd = round(
    Math.abs(tradePlan.entryPriceUsd - tradePlan.stopLossUsd),
    2
  );
  const stopDistancePct = round((stopDistanceUsd / tradePlan.entryPriceUsd) * 100, 2);
  const positionSizeBtc = round(riskUsd / stopDistanceUsd, 6);
  const positionNotionalUsd = round(positionSizeBtc * tradePlan.entryPriceUsd, 2);

  return {
    accountEquityUsd: request.accountEquityUsd,
    maxRiskPct: request.maxRiskPct,
    riskUsd,
    stopDistanceUsd,
    stopDistancePct,
    positionSizeBtc,
    positionNotionalUsd
  };
}

export function parseCopilotRequest(body: unknown): CopilotRequest {
  const record = asRecord(body);

  if (!record) {
    throw new CopilotServiceError(
      "INVALID_REQUEST",
      400,
      false,
      "Request body must be a JSON object."
    );
  }

  const asset = asString(record.asset);
  const horizon = asString(record.horizon);
  const accountEquityUsd = asNumber(record.accountEquityUsd);
  const maxRiskPct = asNumber(record.maxRiskPct);

  if (asset !== "BTC") {
    throw new CopilotServiceError(
      "INVALID_ASSET",
      400,
      false,
      "Milestone 3 only supports BTC."
    );
  }

  if (horizon !== "swing_1_7d") {
    throw new CopilotServiceError(
      "INVALID_HORIZON",
      400,
      false,
      "Milestone 3 only supports the swing_1_7d horizon."
    );
  }

  if (accountEquityUsd === null || accountEquityUsd <= 0) {
    throw new CopilotServiceError(
      "INVALID_EQUITY",
      400,
      false,
      "accountEquityUsd must be a positive number."
    );
  }

  if (maxRiskPct === null || maxRiskPct <= 0 || maxRiskPct > 100) {
    throw new CopilotServiceError(
      "INVALID_RISK",
      400,
      false,
      "maxRiskPct must be greater than 0 and less than or equal to 100."
    );
  }

  return {
    asset: "BTC",
    horizon: "swing_1_7d",
    accountEquityUsd: round(accountEquityUsd, 2),
    maxRiskPct: round(maxRiskPct, 2)
  };
}

export function toCopilotErrorResponse(
  error: unknown
): { status: number; body: CopilotErrorResponse } {
  const model = toModelInfo();

  if (error instanceof SyntaxError) {
    return {
      status: 400,
      body: {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
          retryable: false,
          details: [error.message]
        },
        model
      }
    };
  }

  if (error instanceof CopilotServiceError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
          details: error.details
        },
        model
      }
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR",
        message: "The Copilot request failed unexpectedly.",
        retryable: false,
        details: [getErrorMessage(error)]
      },
      model
    }
  };
}

export async function generateCopilotResponse(
  request: CopilotRequest
): Promise<CopilotResponse> {
  const signalSnapshot = await getMarketSignalSnapshot();

  if (signalSnapshot.status === "not_configured" || signalSnapshot.signals.length === 0) {
    throw new CopilotServiceError(
      "SIGNALS_UNAVAILABLE",
      503,
      true,
      "Live SoSoValue signals are unavailable for Copilot generation.",
      signalSnapshot.notes
    );
  }

  let priceAnchor;

  try {
    priceAnchor = await getBtcSpotPriceAnchor();
  } catch (error) {
    throw new CopilotServiceError(
      "PRICE_UNAVAILABLE",
      503,
      true,
      "BTC spot price could not be fetched for Copilot generation.",
      [getErrorMessage(error)]
    );
  }

  const modelOutput = await generateStructuredOutput({
    request,
    spotPriceUsd: priceAnchor.spotPriceUsd,
    signalSnapshot
  });
  const normalizedTradePlan = normalizeTradePlan(
    modelOutput.thesis,
    modelOutput.tradePlan
  );
  const sizing = calculateSizing(request, normalizedTradePlan);
  const model = toModelInfo();
  const generatedAt = new Date().toISOString();
  const persistence = await saveCopilotRun({
    request,
    generatedAt,
    signalSnapshot,
    priceAnchor,
    thesis: modelOutput.thesis,
    tradePlan: normalizedTradePlan,
    sizing,
    model
  });

  return {
    generatedAt,
    asset: request.asset,
    horizon: request.horizon,
    signalSnapshot,
    priceAnchor,
    thesis: modelOutput.thesis,
    tradePlan: normalizedTradePlan,
    sizing,
    persistence,
    model
  };
}
