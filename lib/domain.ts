export type SignalKind = "etf_inflow" | "news_sentiment" | "sector_rotation" | "macro_event";

export type MarketBias = "long" | "short" | "neutral";

export interface NormalizedSignal {
  id: string;
  kind: SignalKind;
  asset: string;
  title: string;
  summary: string;
  strength: number;
  bias: MarketBias;
  observedAt: string;
  source: "sosovalue";
  evidence: string[];
  inference?: string;
  metadata?: Record<string, boolean | number | string | null>;
}

export interface TradePlan {
  asset: string;
  bias: MarketBias;
  thesis: string;
  entryPlan: string;
  takeProfitPlan: string;
  stopLossPlan: string;
  sizingPlan: string;
  invalidation: string;
  confidence: number;
}

export interface SignalRule {
  id: string;
  name: string;
  enabled: boolean;
  conditionText: string;
  actionText: string;
  createdAt: string;
}

export interface SignalSnapshot {
  generatedAt: string;
  status: "ok" | "partial" | "not_configured";
  notes: string[];
  signals: NormalizedSignal[];
  sourceStatus: Record<string, "ok" | "error" | "skipped">;
}

export type CopilotAsset = "BTC";
export type CopilotHorizon =
  | "intraday_1h_1d"
  | "swing_1_7d"
  | "position_1w_4w";

export interface PriceAnchor {
  source: "coinbase";
  symbol: "BTC-USD";
  spotPriceUsd: number;
  observedAt: string;
}

export interface CopilotRequest {
  asset: CopilotAsset;
  horizon: CopilotHorizon;
  accountEquityUsd: number;
  maxRiskPct: number;
}

export interface CopilotThesis {
  bias: MarketBias;
  confidence: number;
  summary: string;
  rationale: string[];
  risks: string[];
}

export interface CopilotTradePlan {
  actionable: boolean;
  entryPriceUsd: number | null;
  stopLossUsd: number | null;
  takeProfitUsd: number[];
  invalidation: string;
  executionNotes: string[];
}

export interface CopilotSizing {
  accountEquityUsd: number;
  maxRiskPct: number;
  riskUsd: number;
  stopDistanceUsd: number | null;
  stopDistancePct: number | null;
  positionSizeBtc: number | null;
  positionNotionalUsd: number | null;
}

export interface CopilotPersistence {
  status: "saved" | "skipped" | "error";
  id?: string;
  reason?: string;
}

export interface CopilotModelInfo {
  provider: "bedrock";
  modelId: string;
}

export interface CopilotResponse {
  generatedAt: string;
  asset: CopilotAsset;
  horizon: CopilotHorizon;
  signalSnapshot: SignalSnapshot;
  priceAnchor: PriceAnchor;
  thesis: CopilotThesis;
  tradePlan: CopilotTradePlan;
  sizing: CopilotSizing;
  persistence: CopilotPersistence;
  model: CopilotModelInfo;
}

export interface CopilotErrorResponse {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details?: string[];
  };
  model: CopilotModelInfo;
}

export interface ExecutionPlanRequest {
  asset: "BTC";
  thesisBias: MarketBias;
  entryPriceUsd: number;
  stopLossUsd: number;
  takeProfitUsd: number[];
  positionSizeBtc: number;
  copilotHorizon?: CopilotHorizon;
  copilotGeneratedAt?: string;
  copilotRunId?: string;
}

export interface ExecutionPreviewOrder {
  clOrdID: string;
  role: "entry" | "take_profit" | "stop_loss";
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET";
  timeInForce: "GTC" | "IOC";
  price?: string;
  quantity?: string;
  stopPrice?: string;
  reduceOnly: boolean;
}

export interface ExecutionPreviewResponse {
  environment: "testnet";
  symbol: {
    id: number;
    name: "BTC-USD";
    tickSize: string;
    stepSize: string;
    minQuantity: string;
    minNotional: string;
  };
  account: {
    accountId: number;
    apiWalletAddress: string;
  };
  market: {
    markPrice: number;
    indexPrice: number;
  };
  adjustments: string[];
  warnings: string[];
  orders: ExecutionPreviewOrder[];
}

export interface ExecutionSubmitResponse extends ExecutionPreviewResponse {
  submittedAt: string;
  nonce: string;
  requestType: "newOrder";
  response: {
    code: number;
    error?: string;
    timestamp?: number;
    data?: Array<{
      code: number;
      clOrdID: string;
      error?: string;
      orderID?: number;
    }>;
  };
  persistence: {
    status: "saved" | "skipped" | "error";
    id?: string;
    reason?: string;
  };
}

export interface ExecutionErrorResponse {
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details?: string[];
  };
}
