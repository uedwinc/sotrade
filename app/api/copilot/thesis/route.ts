import { NextResponse } from "next/server";

import {
  generateCopilotResponse,
  parseCopilotRequest,
  toCopilotErrorResponse
} from "@/lib/copilot";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = parseCopilotRequest(body);
    const response = await generateCopilotResponse(parsed);

    return NextResponse.json(response, {
      headers: {
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    const failure = toCopilotErrorResponse(error);

    return NextResponse.json(failure.body, {
      status: failure.status,
      headers: {
        "cache-control": "no-store"
      }
    });
  }
}
