import { CopilotWorkspace } from "@/components/copilot/workspace";
import { getBtcSpotPriceAnchor } from "@/lib/btc-price";
import { getMarketSignalSnapshot } from "@/lib/market-signals";

export default async function CopilotPage() {
  const initialSignalSnapshot = await getMarketSignalSnapshot();
  let initialPriceAnchor = null;
  let initialPriceError: string | null = null;

  try {
    initialPriceAnchor = await getBtcSpotPriceAnchor();
  } catch (error) {
    initialPriceError =
      error instanceof Error
        ? error.message
        : "The page could not fetch a live BTC spot price.";
  }

  return (
    <CopilotWorkspace
      initialSignalSnapshot={initialSignalSnapshot}
      initialPriceAnchor={initialPriceAnchor}
      initialPriceError={initialPriceError}
    />
  );
}
