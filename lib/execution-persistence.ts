import { randomUUID } from "crypto";

import type {
  ExecutionPlanRequest,
  ExecutionPreviewResponse,
  ExecutionSubmitResponse
} from "@/lib/domain";
import { getPgPool } from "@/lib/db";

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

export async function saveExecutionRun(input: {
  request: ExecutionPlanRequest;
  preview: ExecutionPreviewResponse;
  response: ExecutionSubmitResponse;
}) {
  try {
    const pool = await ensureTable();

    if (!pool) {
      return {
        status: "skipped" as const,
        reason: "DATABASE_URL is not configured."
      };
    }

    const id = randomUUID();

    await pool.query(
      `
        INSERT INTO execution_runs (
          id,
          submitted_at,
          asset,
          copilot_generated_at,
          copilot_run_id,
          request_payload,
          preview_payload,
          execution_payload
        )
        VALUES (
          $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb
        )
      `,
      [
        id,
        input.response.submittedAt,
        input.request.asset,
        input.request.copilotGeneratedAt ?? null,
        input.request.copilotRunId ?? null,
        JSON.stringify(input.request),
        JSON.stringify(input.preview),
        JSON.stringify(input.response)
      ]
    );

    return {
      status: "saved" as const,
      id
    };
  } catch (error) {
    return {
      status: "error" as const,
      reason: getErrorMessage(error)
    };
  }
}
