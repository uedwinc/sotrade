import { getSoSoValueEnvironment } from "@/lib/config";

export type EtfType = "us-btc-spot" | "us-eth-spot";

export interface SoSoValueEtfPoint {
  date: string;
  totalNetInflow: number;
  totalValueTraded: number;
  totalNetAssets: number;
  cumNetInflow: number;
}

export interface SoSoValueCurrentEtfMetrics {
  totalNetAssets: {
    value: number;
    lastUpdateDate: string;
  };
  totalNetAssetsPercentage: {
    value: number;
    lastUpdateDate: string;
  };
  totalTokenHoldings: {
    value: number;
    lastUpdateDate: string;
  };
  dailyNetInflow: {
    value: number;
    lastUpdateDate: string;
  };
  cumNetInflow: {
    value: number;
    lastUpdateDate: string;
  };
  dailyTotalValueTraded: {
    value: number;
    lastUpdateDate: string;
  };
}

export interface SoSoValueNewsItem {
  id: string;
  category?: number;
  sourceLink?: string;
  releaseTime?: number;
  author?: string;
  matchedCurrencies: Array<{
    id?: string;
    currencyId?: string;
    symbol?: string;
    currencySymbol?: string;
    name?: string;
    currencyName?: string;
  }>;
  tags: string[];
  multilanguageContent: Array<{
    language?: string;
    title?: string;
    content?: string;
  }>;
}

interface ApiEnvelope<T> {
  code: number;
  msg: string | null;
  data: T;
  traceId?: string;
}

interface FeaturedNewsResponse {
  list?: unknown[];
}

function ensureConfigured() {
  const env = getSoSoValueEnvironment();

  if (!env.apiKey) {
    throw new Error("SOSOVALUE_API_KEY is missing.");
  }

  return env;
}

function asNumber(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function toNewsItem(value: unknown): SoSoValueNewsItem {
  const record = typeof value === "object" && value ? value : {};
  const rawMatched =
    "matchedCurrencies" in record && Array.isArray(record.matchedCurrencies)
      ? record.matchedCurrencies
      : [];
  const rawContent =
    "multilanguageContent" in record && Array.isArray(record.multilanguageContent)
      ? record.multilanguageContent
      : [];

  return {
    id: "id" in record ? asString(record.id) : "",
    category: "category" in record ? asNumber(record.category) : undefined,
    sourceLink: "sourceLink" in record ? asString(record.sourceLink) : undefined,
    releaseTime: "releaseTime" in record ? asNumber(record.releaseTime) : undefined,
    author: "author" in record ? asString(record.author) : undefined,
    matchedCurrencies: rawMatched
      .map((entry) => {
        const item = typeof entry === "object" && entry ? entry : {};

        return {
          id: "id" in item ? asString(item.id) : undefined,
          currencyId: "currencyId" in item ? asString(item.currencyId) : undefined,
          symbol:
            "symbol" in item
              ? asString(item.symbol)
              : "currencySymbol" in item
                ? asString(item.currencySymbol)
                : undefined,
          currencySymbol:
            "currencySymbol" in item ? asString(item.currencySymbol) : undefined,
          name:
            "name" in item
              ? asString(item.name)
              : "currencyName" in item
                ? asString(item.currencyName)
                : undefined,
          currencyName:
            "currencyName" in item ? asString(item.currencyName) : undefined
        };
      })
      .filter((entry) => entry.id || entry.currencyId || entry.symbol || entry.name),
    tags: "tags" in record ? asStringArray(record.tags) : [],
    multilanguageContent: rawContent
      .map((entry) => {
        const item = typeof entry === "object" && entry ? entry : {};

        return {
          language: "language" in item ? asString(item.language) : undefined,
          title: "title" in item ? asString(item.title) : undefined,
          content: "content" in item ? asString(item.content) : undefined
        };
      })
      .filter((entry) => entry.title || entry.content)
  };
}

async function fetchJson<T>(
  input: string,
  init: RequestInit & { next?: { revalidate?: number } }
) {
  const response = await fetch(input, {
    ...init
  });

  if (!response.ok) {
    throw new Error(`SoSoValue request failed with HTTP ${response.status}.`);
  }

  const body = (await response.json()) as ApiEnvelope<T>;

  if (body.code !== 0) {
    throw new Error(body.msg || "SoSoValue returned a non-zero code.");
  }

  return body.data;
}

function parseMetricRecord(value: unknown) {
  const record = typeof value === "object" && value ? value : {};

  return {
    value: "value" in record ? asNumber(record.value) : 0,
    lastUpdateDate: "lastUpdateDate" in record ? asString(record.lastUpdateDate) : ""
  };
}

export async function fetchEtfHistoricalInflow(type: EtfType) {
  const env = ensureConfigured();
  const url = `${env.etfBaseUrl}/openapi/v2/etf/historicalInflowChart`;
  const data = await fetchJson<{ list?: unknown[] }>(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-soso-api-key": env.apiKey
    },
    body: JSON.stringify({ type }),
    next: { revalidate: 300 }
  });

  return (data.list ?? []).map((entry) => {
    const item = typeof entry === "object" && entry ? entry : {};

    return {
      date: "date" in item ? asString(item.date) : "",
      totalNetInflow: "totalNetInflow" in item ? asNumber(item.totalNetInflow) : 0,
      totalValueTraded:
        "totalValueTraded" in item ? asNumber(item.totalValueTraded) : 0,
      totalNetAssets: "totalNetAssets" in item ? asNumber(item.totalNetAssets) : 0,
      cumNetInflow: "cumNetInflow" in item ? asNumber(item.cumNetInflow) : 0
    } satisfies SoSoValueEtfPoint;
  });
}

export async function fetchCurrentEtfDataMetrics(type: EtfType) {
  const env = ensureConfigured();
  const url = `${env.etfBaseUrl}/openapi/v2/etf/currentEtfDataMetrics`;
  const data = await fetchJson<Record<string, unknown>>(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-soso-api-key": env.apiKey
    },
    body: JSON.stringify({ type }),
    next: { revalidate: 300 }
  });

  return {
    totalNetAssets: parseMetricRecord(data.totalNetAssets),
    totalNetAssetsPercentage: parseMetricRecord(data.totalNetAssetsPercentage),
    totalTokenHoldings: parseMetricRecord(data.totalTokenHoldings),
    dailyNetInflow: parseMetricRecord(data.dailyNetInflow),
    cumNetInflow: parseMetricRecord(data.cumNetInflow),
    dailyTotalValueTraded: parseMetricRecord(data.dailyTotalValueTraded)
  } satisfies SoSoValueCurrentEtfMetrics;
}

export async function fetchFeaturedNews(params: {
  pageNum?: number;
  pageSize?: number;
  currencyId?: string;
  categoryList?: number[];
}) {
  const env = ensureConfigured();
  const search = new URLSearchParams({
    pageNum: String(params.pageNum ?? 1),
    pageSize: String(params.pageSize ?? 12)
  });

  if (params.currencyId) {
    search.set("currencyId", params.currencyId);
  }

  if (params.categoryList?.length) {
    search.set("categoryList", params.categoryList.join(","));
  }

  const url = `${env.openApiBaseUrl}/api/v1/news/featured/currency?${search.toString()}`;
  const data = await fetchJson<FeaturedNewsResponse>(url, {
    method: "GET",
    headers: {
      "x-soso-api-key": env.apiKey
    },
    next: { revalidate: 300 }
  });

  return (data.list ?? []).map(toNewsItem).filter((item) => item.id);
}

export function getSoSoValueReadiness() {
  const env = getSoSoValueEnvironment();

  return {
    configured: Boolean(env.apiKey),
    btcCurrencyId: env.btcCurrencyId
  };
}
