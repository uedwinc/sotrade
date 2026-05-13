import { randomUUID } from "crypto";

import type {
  CopilotModelInfo,
  CopilotPersistence,
  CopilotRequest,
  CopilotSizing,
  CopilotThesis,
  CopilotTradePlan,
  PriceAnchor,
  SignalSnapshot
} from "@/lib/domain";
import { getPgPool } from "@/lib/db";

interface SaveCopilotRunParams {
  request: CopilotRequest;
  generatedAt: string;
  signalSnapshot: SignalSnapshot;
  priceAnchor: PriceAnchor;
  thesis: CopilotThesis;
  tradePlan: CopilotTradePlan;
  sizing: CopilotSizing;
  model: CopilotModelInfo;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown persistence error";
}

async function ensureTable() {
  const pool = getPgPool();

  if (!pool) {
    return null;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS copilot_runs (
      id TEXT PRIMARY KEY,
      generated_at TIMESTAMPTZ NOT NULL,
      asset TEXT NOT NULL,
      horizon TEXT NOT NULL,
      account_equity_usd DOUBLE PRECISION NOT NULL,
      max_risk_pct DOUBLE PRECISION NOT NULL,
      signal_snapshot JSONB NOT NULL,
      price_anchor JSONB NOT NULL,
      model JSONB NOT NULL,
      thesis JSONB NOT NULL,
      trade_plan JSONB NOT NULL,
      sizing JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return pool;
}

export async function saveCopilotRun(
  params: SaveCopilotRunParams
): Promise<CopilotPersistence> {
  try {
    const pool = await ensureTable();

    if (!pool) {
      return {
        status: "skipped",
        reason: "DATABASE_URL is not configured."
      };
    }

    const id = randomUUID();

    await pool.query(
      `
        INSERT INTO copilot_runs (
          id,
          generated_at,
          asset,
          horizon,
          account_equity_usd,
          max_risk_pct,
          signal_snapshot,
          price_anchor,
          model,
          thesis,
          trade_plan,
          sizing
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb
        )
      `,
      [
        id,
        params.generatedAt,
        params.request.asset,
        params.request.horizon,
        params.request.accountEquityUsd,
        params.request.maxRiskPct,
        JSON.stringify(params.signalSnapshot),
        JSON.stringify(params.priceAnchor),
        JSON.stringify(params.model),
        JSON.stringify(params.thesis),
        JSON.stringify(params.tradePlan),
        JSON.stringify(params.sizing)
      ]
    );

    return {
      status: "saved",
      id
    };
  } catch (error) {
    return {
      status: "error",
      reason: getErrorMessage(error)
    };
  }
}
