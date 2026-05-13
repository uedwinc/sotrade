import { NextResponse } from "next/server";

import {
  parseExecutionPlanRequest,
  submitExecutionPlan,
  toExecutionErrorResponse
} from "@/lib/sodex";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseExecutionPlanRequest(body);
    const response = await submitExecutionPlan(parsed);

    return NextResponse.json(response, {
      headers: {
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    const failure = toExecutionErrorResponse(error);

    return NextResponse.json(failure.body, {
      status: failure.status,
      headers: {
        "cache-control": "no-store"
      }
    });
  }
}
