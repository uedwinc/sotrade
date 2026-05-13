export type SignalKind = "etf_inflow" | "news_sentiment" | "sector_rotation" | "macro_event";

export type MarketBias = "long" | "short" | "neutral";

export interface NormalizedSignal {
  id: string;
  kind: SignalKind;
  asset: string;
  title: string;
  summary: string;
  strength: number;
  observedAt: string;
  source: "sosovalue";
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
