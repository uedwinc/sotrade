function readEnv(name: string) {
  return process.env[name]?.trim();
}

export function assertBaseEnv() {
  return {
    appName: readEnv("NEXT_PUBLIC_APP_NAME") ?? "SoTrade",
    appUrl: readEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000"
  };
}

export function getTradingEnvironment() {
  const env = readEnv("SODEX_ENV") ?? "testnet";

  if (env !== "testnet") {
    throw new Error("SoTrade is locked to SoDEX testnet in this phase.");
  }

  const endpoints = [
    readEnv("SODEX_SPOT_REST_URL"),
    readEnv("SODEX_PERPS_REST_URL"),
    readEnv("SODEX_SPOT_WS_URL"),
    readEnv("SODEX_PERPS_WS_URL")
  ].filter(Boolean) as string[];

  for (const url of endpoints) {
    if (!url.includes("testnet")) {
      throw new Error(`Non-testnet SoDEX endpoint detected: ${url}`);
    }
  }

  return {
    env,
    spotRestUrl: readEnv("SODEX_SPOT_REST_URL"),
    perpsRestUrl: readEnv("SODEX_PERPS_REST_URL"),
    spotWsUrl: readEnv("SODEX_SPOT_WS_URL"),
    perpsWsUrl: readEnv("SODEX_PERPS_WS_URL")
  };
}

export function getSoSoValueEnvironment() {
  return {
    apiKey: readEnv("SOSOVALUE_API_KEY"),
    etfBaseUrl: readEnv("SOSOVALUE_API_BASE_URL") ?? "https://api.sosovalue.xyz",
    openApiBaseUrl:
      readEnv("SOSOVALUE_OPENAPI_BASE_URL") ?? "https://openapi.sosovalue.com",
    btcCurrencyId:
      readEnv("SOSOVALUE_BTC_CURRENCY_ID") ?? "1673723677362319866"
  };
}

export function getDatabaseUrl() {
  return readEnv("DATABASE_URL");
}

export function getBedrockEnvironment() {
  return {
    region:
      readEnv("AWS_REGION") ??
      readEnv("AWS_DEFAULT_REGION") ??
      "us-east-1",
    modelId: readEnv("BEDROCK_MODEL_ID") ?? "anthropic.claude-sonnet-4-6"
  };
}
