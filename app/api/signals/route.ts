import { NextResponse } from "next/server";

import { getMarketSignalSnapshot } from "@/lib/market-signals";

export async function GET() {
  const snapshot = await getMarketSignalSnapshot();

  return NextResponse.json(snapshot, {
    headers: {
      "cache-control": "no-store"
    }
  });
}
