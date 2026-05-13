import { getDatabaseUrl } from "@/lib/config";
import { getPgPool } from "@/lib/db";
import { getCopilotHorizonOption, isCopilotHorizon } from "@/lib/copilot-horizons";

type JournalEntryKind = "copilot" | "execution";

export interface JournalEntry {
  id: string;
  kind: JournalEntryKind;
  occurredAt: string;
  title: string;
  detail: string;
  meta: string[];
}

export interface JournalFeed {
  status: "ready" | "empty" | "not_configured" | "error";
  entries: JournalEntry[];
  notes: string[];
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

function formatUsd(value: number | null) {
  if (value === null) {
    return "not set";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1000 ? 0 : 2
  }).format(value);
}

function titleCase(value: string) {
  if (!value) {
    return "Unknown";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

async function ensureJournalTables() {
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS execution_runs (
      id TEXT PRIMARY KEY,
      submitted_at TIMESTAMPTZ NOT NULL,
      asset TEXT NOT NULL,
      copilot_generated_at TIMESTAMPTZ NULL,
      copilot_run_id TEXT NULL,
      request_payload JSONB NOT NULL,
      preview_payload JSONB NOT NULL,
      execution_payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  return pool;
}

function toCopilotEntry(row: Record<string, unknown>): JournalEntry {
  const thesis = asRecord(row.thesis);
  const tradePlan = asRecord(row.trade_plan);
  const bias = asString(thesis?.bias) || "neutral";
  const summary = asString(thesis?.summary) || "Copilot thesis generated.";
  const horizonId = asString(row.horizon);
  const horizonLabel =
    isCopilotHorizon(horizonId) ? getCopilotHorizonOption(horizonId).label : horizonId;
  const actionable = tradePlan?.actionable === true;
  const entryPrice = asNumber(tradePlan?.entryPriceUsd);
  const stopLoss = asNumber(tradePlan?.stopLossUsd);
  const takeProfitLevels = Array.isArray(tradePlan?.takeProfitUsd)
    ? tradePlan?.takeProfitUsd
    : [];
  const firstTakeProfit = asNumber(takeProfitLevels[0]);

  const detail = actionable
    ? `${summary} Entry ${formatUsd(entryPrice)}, stop ${formatUsd(stopLoss)}, first take-profit ${formatUsd(firstTakeProfit)}.`
    : `${summary} The Copilot ended in a no-trade stance for this cycle.`;

  return {
    id: asString(row.id) || `copilot-${asString(row.generated_at)}`,
    kind: "copilot",
    occurredAt: asString(row.generated_at),
    title:
      bias === "neutral"
        ? "Copilot no-trade decision generated"
        : `Copilot ${bias} plan generated`,
    detail,
    meta: [horizonLabel || "Unknown cycle", `Bias ${titleCase(bias)}`, "Bedrock"]
  };
}

function toExecutionEntry(row: Record<string, unknown>): JournalEntry {
  const requestPayload = asRecord(row.request_payload);
  const previewPayload = asRecord(row.preview_payload);
  const executionPayload = asRecord(row.execution_payload);
  const response = asRecord(executionPayload?.response);
  const responseData = Array.isArray(response?.data) ? response?.data : [];
  const acceptedCount = responseData.filter((item) => asRecord(item)?.code === 0).length;
  const requestBias = asString(requestPayload?.thesisBias) || "unknown";
  const previewMarket = asRecord(previewPayload?.market);
  const markPrice = asNumber(previewMarket?.markPrice);
  const horizonId = asString(requestPayload?.copilotHorizon);
  const horizonLabel =
    isCopilotHorizon(horizonId) ? getCopilotHorizonOption(horizonId).label : horizonId;
  const gatewayCode = asNumber(response?.code);

  return {
    id: asString(row.id) || `execution-${asString(row.submitted_at)}`,
    kind: "execution",
    occurredAt: asString(row.submitted_at),
    title: `SoDEX testnet ${requestBias || "trade"} packet submitted`,
    detail: `${acceptedCount} order${acceptedCount === 1 ? "" : "s"} were accepted by the SoDEX gateway. This log captures submission, not final fill state.${markPrice !== null ? ` Mark price was ${formatUsd(markPrice)}.` : ""}`,
    meta: [
      horizonLabel || "Unknown cycle",
      `Bias ${titleCase(requestBias)}`,
      gatewayCode === null ? "Gateway code unknown" : `Gateway code ${gatewayCode}`,
      "Testnet"
    ]
  };
}

function compareDesc(left: JournalEntry, right: JournalEntry) {
  return new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime();
}

export async function getJournalFeed(limit = 20): Promise<JournalFeed> {
  if (!getDatabaseUrl()) {
    return {
      status: "not_configured",
      entries: [],
      notes: [
        "DATABASE_URL is not configured, so Copilot runs and execution submissions are not persisted yet.",
        "Trades that executed while persistence was skipped cannot be backfilled into the journal with the current implementation."
      ]
    };
  }

  try {
    const pool = await ensureJournalTables();

    if (!pool) {
      return {
        status: "not_configured",
        entries: [],
        notes: [
          "DATABASE_URL is not configured, so the journal has no persisted source."
        ]
      };
    }

    const [copilotRows, executionRows] = await Promise.all([
      pool.query(
        `
          SELECT id, generated_at, horizon, thesis, trade_plan
          FROM copilot_runs
          ORDER BY generated_at DESC
          LIMIT $1
        `,
        [limit]
      ),
      pool.query(
        `
          SELECT id, submitted_at, request_payload, preview_payload, execution_payload
          FROM execution_runs
          ORDER BY submitted_at DESC
          LIMIT $1
        `,
        [limit]
      )
    ]);

    const entries = [
      ...copilotRows.rows.map((row) => toCopilotEntry(row as Record<string, unknown>)),
      ...executionRows.rows.map((row) => toExecutionEntry(row as Record<string, unknown>))
    ]
      .sort(compareDesc)
      .slice(0, limit);

    if (entries.length === 0) {
      return {
        status: "empty",
        entries: [],
        notes: [
          "The database is configured, but no Copilot or execution runs have been saved yet.",
          "Only activity that happens after persistence is enabled will appear here."
        ]
      };
    }

    return {
      status: "ready",
      entries,
      notes: [
        "This journal currently shows persisted Copilot generations and execution submissions.",
        "It does not yet reconcile downstream SoDEX fills, cancellations, or closed-position outcomes."
      ]
    };
  } catch (error) {
    return {
      status: "error",
      entries: [],
      notes: [
        error instanceof Error
          ? error.message
          : "The journal query failed unexpectedly."
      ]
    };
  }
}
