import { NextResponse } from "next/server";

import {
  generateExecutionPreview,
  parseExecutionPlanRequest,
  toExecutionErrorResponse
} from "@/lib/sodex";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseExecutionPlanRequest(body);
    const preview = await generateExecutionPreview(parsed);
    const { requestBody: _requestBody, ...publicPreview } = preview;

    return NextResponse.json(publicPreview, {
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
