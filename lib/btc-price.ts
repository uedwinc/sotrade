import type { PriceAnchor } from "@/lib/domain";

interface CoinbaseSpotResponse {
  data?: {
    amount?: string;
    currency?: string;
  };
}

export async function getBtcSpotPriceAnchor(): Promise<PriceAnchor> {
  const response = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Coinbase spot price request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as CoinbaseSpotResponse;
  const amount = Number(body.data?.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Coinbase spot price response did not include a valid BTC-USD amount.");
  }

  return {
    source: "coinbase",
    symbol: "BTC-USD",
    spotPriceUsd: amount,
    observedAt: new Date().toISOString()
  };
}
