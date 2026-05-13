import { NextResponse } from "next/server";

import { assertBaseEnv, getTradingEnvironment } from "@/lib/config";

export function GET() {
  const baseEnv = assertBaseEnv();
  const trading = getTradingEnvironment();

  return NextResponse.json({
    appName: baseEnv.appName,
    appUrl: baseEnv.appUrl,
    tradingEnv: trading.env,
    endpoints: {
      spotRestUrl: trading.spotRestUrl,
      perpsRestUrl: trading.perpsRestUrl,
      spotWsUrl: trading.spotWsUrl,
      perpsWsUrl: trading.perpsWsUrl
    }
  });
}
