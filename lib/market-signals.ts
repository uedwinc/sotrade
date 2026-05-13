import type { NormalizedSignal, SignalSnapshot } from "@/lib/domain";
import {
  fetchEtfHistoricalInflow,
  fetchFeaturedNews,
  getSoSoValueReadiness,
  type SoSoValueEtfPoint,
  type SoSoValueNewsItem
} from "@/lib/sosovalue";

const POSITIVE_KEYWORDS = [
  "approval",
  "breakout",
  "bull",
  "bullish",
  "buy",
  "inflow",
  "launch",
  "partnership",
  "rally",
  "strength",
  "surge",
  "upside"
];

const NEGATIVE_KEYWORDS = [
  "bear",
  "bearish",
  "crackdown",
  "decline",
  "delay",
  "drop",
  "exploit",
  "hack",
  "liquidation",
  "outflow",
  "selloff",
  "weakness"
];

const MACRO_RISK_OFF = [
  "hawkish",
  "inflation",
  "recession",
  "rate hike",
  "selloff",
  "tariff",
  "war"
];

const MACRO_RISK_ON = [
  "cooling inflation",
  "dovish",
  "easing",
  "liquidity",
  "rate cut",
  "soft landing",
  "stimulus"
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function compactUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

function toIsoTimestamp(value?: number | string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value === "string" && value) {
    return new Date(value).toISOString();
  }

  return new Date().toISOString();
}

function pickText(item: SoSoValueNewsItem) {
  const preferred =
    item.multilanguageContent.find((entry) => entry.language === "en") ??
    item.multilanguageContent[0];

  const title = preferred?.title?.trim() || "";
  const content = preferred?.content?.replace(/<[^>]+>/g, " ").trim() || "";

  return {
    title,
    content,
    combined: `${title} ${content}`.toLowerCase()
  };
}

function scoreKeywords(text: string, positives: string[], negatives: string[]) {
  let score = 0;

  for (const keyword of positives) {
    if (text.includes(keyword)) {
      score += 1;
    }
  }

  for (const keyword of negatives) {
    if (text.includes(keyword)) {
      score -= 1;
    }
  }

  return score;
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildEtfSignal(asset: "BTC" | "ETH", points: SoSoValueEtfPoint[]): NormalizedSignal {
  const latest = points.at(-1);
  const recent = points.slice(-3);
  const threeDayFlow = recent.reduce((sum, point) => sum + point.totalNetInflow, 0);
  const consistency = recent.filter((point) => point.totalNetInflow > 0).length / Math.max(recent.length, 1);
  const strength = clamp(Math.round(Math.min(Math.abs(threeDayFlow) / 5_000_000, 100)), 0, 100);
  const bias = threeDayFlow > 0 ? "long" : threeDayFlow < 0 ? "short" : "neutral";
  const latestFlow = latest?.totalNetInflow ?? 0;

  return {
    id: `sosovalue-${asset.toLowerCase()}-etf`,
    kind: "etf_inflow",
    asset,
    title: `${asset} ETF flow snapshot`,
    summary:
      `${asset} spot ETF flow is ${latestFlow >= 0 ? "supportive" : "soft"} with ` +
      `${compactUsd(threeDayFlow)} net flow across the last ${recent.length} sessions.`,
    strength,
    bias,
    observedAt: toIsoTimestamp(latest?.date),
    source: "sosovalue",
    evidence: [
      `Latest daily net inflow: ${compactUsd(latestFlow)}`,
      `Three-day cumulative flow: ${compactUsd(threeDayFlow)}`,
      `Positive-session ratio: ${Math.round(consistency * 100)}%`
    ],
    metadata: {
      latestNetInflow: latestFlow,
      threeDayNetInflow: threeDayFlow,
      totalNetAssets: latest?.totalNetAssets ?? 0
    }
  };
}

function buildNewsSentimentSignal(items: SoSoValueNewsItem[]): NormalizedSignal {
  const scored = items.map((item) => {
    const text = pickText(item);
    return {
      item,
      headline: text.title || "Untitled SoSoValue item",
      score: scoreKeywords(text.combined, POSITIVE_KEYWORDS, NEGATIVE_KEYWORDS)
    };
  });
  const aggregate = average(scored.map((entry) => entry.score));
  const strength = clamp(Math.round(Math.abs(aggregate) * 22), 8, 82);
  const bias = aggregate > 0.2 ? "long" : aggregate < -0.2 ? "short" : "neutral";
  const latestTimestamp = Math.max(...scored.map((entry) => entry.item.releaseTime ?? 0), Date.now());

  return {
    id: "sosovalue-btc-news-sentiment",
    kind: "news_sentiment",
    asset: "BTC",
    title: "BTC news and research tone",
    summary:
      bias === "neutral"
        ? "Recent SoSoValue BTC headlines are balanced overall, with no strong directional skew."
        : `Recent SoSoValue BTC headlines lean ${bias === "long" ? "constructive" : "defensive"} overall.`,
    strength,
    bias,
    observedAt: toIsoTimestamp(latestTimestamp),
    source: "sosovalue",
    evidence: scored.slice(0, 3).map((entry) => entry.headline),
    inference:
      "This signal is inferred from headline and content keyword scoring over SoSoValue featured news and research.",
    metadata: {
      averageHeadlineScore: Number(aggregate.toFixed(2)),
      itemCount: scored.length
    }
  };
}

function buildMacroSignal(items: SoSoValueNewsItem[]): NormalizedSignal {
  const scored = items.map((item) => {
    const text = pickText(item);
    return {
      item,
      headline: text.title || "Untitled macro item",
      score: scoreKeywords(text.combined, MACRO_RISK_ON, MACRO_RISK_OFF)
    };
  });
  const aggregate = average(scored.map((entry) => entry.score));
  const bias = aggregate > 0.15 ? "long" : aggregate < -0.15 ? "short" : "neutral";
  const strength = clamp(Math.round(Math.abs(aggregate) * 24), 10, 84);
  const latestTimestamp = Math.max(...scored.map((entry) => entry.item.releaseTime ?? 0), Date.now());

  return {
    id: "sosovalue-macro-tone",
    kind: "macro_event",
    asset: "GLOBAL",
    title: "Macro risk tone",
    summary:
      bias === "neutral"
        ? "Macro-oriented SoSoValue coverage is mixed right now, so the app should treat macro as a non-confirming input."
        : `Macro-oriented SoSoValue coverage currently reads ${bias === "long" ? "risk-on" : "risk-off"}.`,
    strength,
    bias,
    observedAt: toIsoTimestamp(latestTimestamp),
    source: "sosovalue",
    evidence: scored.slice(0, 3).map((entry) => entry.headline),
    inference:
      "This signal is inferred from keyword scoring over SoSoValue macro news and macro research categories.",
    metadata: {
      averageMacroScore: Number(aggregate.toFixed(2)),
      itemCount: scored.length
    }
  };
}

function buildRotationProxySignal(items: SoSoValueNewsItem[]): NormalizedSignal {
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const currency of item.matchedCurrencies) {
      const symbol = currency.symbol || currency.currencySymbol || currency.name || currency.currencyName;

      if (!symbol) {
        continue;
      }

      counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
    }
  }

  const leaders = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);
  const [topLeader] = leaders;

  return {
    id: "sosovalue-rotation-proxy",
    kind: "sector_rotation",
    asset: topLeader?.[0] ?? "MARKET",
    title: "Market leadership proxy",
    summary:
      leaders.length > 0
        ? `${leaders.map(([symbol, count]) => `${symbol} (${count})`).join(", ")} are receiving the most recent SoSoValue matched-currency attention.`
        : "No matched-currency leadership signal was available from the current SoSoValue feed sample.",
    strength: clamp((topLeader?.[1] ?? 0) * 12, 0, 88),
    bias: "neutral",
    observedAt: toIsoTimestamp(
      Math.max(...items.map((entry) => entry.releaseTime ?? 0), Date.now())
    ),
    source: "sosovalue",
    evidence: leaders.map(([symbol, count]) => `${symbol}: ${count} mentions`),
    inference:
      "This is a temporary rotation proxy inferred from matched-currency frequency in recent SoSoValue featured feed items, not a direct sector endpoint."
  };
}

export async function getMarketSignalSnapshot(): Promise<SignalSnapshot> {
  const readiness = getSoSoValueReadiness();

  if (!readiness.configured) {
    return {
      generatedAt: new Date().toISOString(),
      status: "not_configured",
      notes: [
        "Add SOSOVALUE_API_KEY to .env.local to enable live signal ingestion.",
        "The rotation signal is currently a proxy inferred from matched-currency frequency in recent featured feed items."
      ],
      signals: [],
      sourceStatus: {
        btcEtf: "skipped",
        ethEtf: "skipped",
        btcNews: "skipped",
        macroNews: "skipped",
        marketFeed: "skipped"
      }
    };
  }

  const sourceStatus: SignalSnapshot["sourceStatus"] = {
    btcEtf: "skipped",
    ethEtf: "skipped",
    btcNews: "skipped",
    macroNews: "skipped",
    marketFeed: "skipped"
  };
  const notes = [
    "ETF flow data comes from SoSoValue's official ETF historical inflow endpoint.",
    "News and macro signals are inferred from SoSoValue featured feed categories using lightweight keyword scoring.",
    "Rotation is currently a proxy inferred from matched-currency frequency until a direct sector endpoint is integrated."
  ];
  const signals: NormalizedSignal[] = [];

  const [
    btcEtfResult,
    ethEtfResult,
    btcNewsResult,
    macroNewsResult,
    marketFeedResult
  ] = await Promise.allSettled([
    fetchEtfHistoricalInflow("us-btc-spot"),
    fetchEtfHistoricalInflow("us-eth-spot"),
    fetchFeaturedNews({
      currencyId: readiness.btcCurrencyId,
      pageSize: 12,
      categoryList: [1, 2, 4]
    }),
    fetchFeaturedNews({
      pageSize: 12,
      categoryList: [5, 6]
    }),
    fetchFeaturedNews({
      pageSize: 18,
      categoryList: [1, 2, 4, 10]
    })
  ]);

  if (btcEtfResult.status === "fulfilled" && btcEtfResult.value.length > 0) {
    sourceStatus.btcEtf = "ok";
    signals.push(buildEtfSignal("BTC", btcEtfResult.value));
  } else {
    sourceStatus.btcEtf = "error";
    notes.push("BTC ETF flow fetch failed or returned no data.");
  }

  if (ethEtfResult.status === "fulfilled" && ethEtfResult.value.length > 0) {
    sourceStatus.ethEtf = "ok";
    signals.push(buildEtfSignal("ETH", ethEtfResult.value));
  } else {
    sourceStatus.ethEtf = "error";
    notes.push("ETH ETF flow fetch failed or returned no data.");
  }

  if (btcNewsResult.status === "fulfilled" && btcNewsResult.value.length > 0) {
    sourceStatus.btcNews = "ok";
    signals.push(buildNewsSentimentSignal(btcNewsResult.value));
  } else {
    sourceStatus.btcNews = "error";
    notes.push("BTC featured news fetch failed or returned no data.");
  }

  if (macroNewsResult.status === "fulfilled" && macroNewsResult.value.length > 0) {
    sourceStatus.macroNews = "ok";
    signals.push(buildMacroSignal(macroNewsResult.value));
  } else {
    sourceStatus.macroNews = "error";
    notes.push("Macro featured news fetch failed or returned no data.");
  }

  if (marketFeedResult.status === "fulfilled" && marketFeedResult.value.length > 0) {
    sourceStatus.marketFeed = "ok";
    signals.push(buildRotationProxySignal(marketFeedResult.value));
  } else {
    sourceStatus.marketFeed = "error";
    notes.push("Market-wide featured feed fetch failed or returned no matched-currency data.");
  }

  const failedCount = Object.values(sourceStatus).filter((value) => value === "error").length;

  return {
    generatedAt: new Date().toISOString(),
    status: failedCount === 0 ? "ok" : "partial",
    notes,
    signals
      .sort((left, right) => right.observedAt.localeCompare(left.observedAt)),
    sourceStatus
  };
}
