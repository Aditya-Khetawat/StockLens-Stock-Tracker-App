import "server-only";

import { getDateRange, validateArticle, formatArticle } from "@/lib/utils";
import { HttpError, withRetry } from "@/lib/net/retry";

// Server-only Finnhub client. Nothing here may be exported from a "use server"
// file: every request goes to FINNHUB_BASE_URL with our token, so callers can
// choose a path and parameters but never an arbitrary URL.

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

type CompanyProfile = {
  name?: string;
  ticker?: string;
  exchange?: string;
  marketCapitalization?: number;
  finnhubIndustry?: string;
};

export type Quote = {
  price: number;
  /** Dollar change since the previous close. */
  change: number | null;
  changePercent: number | null;
  /** True when Finnhub is unreachable and this is the last good price. */
  stale: boolean;
  /** When the price was fetched (ms since epoch). */
  asOf: number;
};

// Last good quote per symbol, served (marked stale) during short outages.
// Per server instance; good enough to ride out a brief upstream failure.
const STALE_QUOTE_MAX_AGE_MS = 15 * 60 * 1000;
const lastGoodQuotes = new Map<string, Quote>();

function getToken(): string {
  const token =
    process.env.FINNHUB_API_KEY || process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
  if (!token) throw new Error("FINNHUB API key is not configured");
  return token;
}

async function finnhubGet<T>(
  path: string,
  params: Record<string, string>,
  revalidateSeconds?: number,
): Promise<T> {
  const url = new URL(`${FINNHUB_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("token", getToken());

  const options: RequestInit & { next?: { revalidate?: number } } =
    revalidateSeconds
      ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
      : { cache: "no-store" };

  return withRetry(async () => {
    const res = await fetch(url, options);
    if (!res.ok) {
      // Never log or rethrow the upstream body: it can be a full HTML error page.
      throw new HttpError(res.status, `Finnhub ${path} failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  });
}

const normalizeSymbol = (symbol: string) => symbol.trim().toUpperCase();

/**
 * Current price (one API call, retried on transient errors). Returns null if
 * the symbol has no price. If Finnhub stays down, returns the last good quote
 * from the past 15 minutes with `stale: true`, otherwise throws.
 */
export async function getQuote(symbol: string): Promise<Quote | null> {
  const key = normalizeSymbol(symbol);
  let quote: QuoteData;
  try {
    quote = await finnhubGet<QuoteData>("/quote", { symbol: key }, 60);
  } catch (error) {
    const fallback = lastGoodQuotes.get(key);
    if (fallback && Date.now() - fallback.asOf <= STALE_QUOTE_MAX_AGE_MS) {
      return { ...fallback, stale: true };
    }
    throw error;
  }

  if (typeof quote?.c !== "number" || quote.c <= 0) return null;
  const fresh: Quote = {
    price: quote.c,
    change: typeof quote.d === "number" ? quote.d : null,
    changePercent: typeof quote.dp === "number" ? quote.dp : null,
    stale: false,
    asOf: Date.now(),
  };
  lastGoodQuotes.set(key, fresh);
  return fresh;
}

export async function getCompanyProfile(
  symbol: string,
): Promise<CompanyProfile | null> {
  const profile = await finnhubGet<CompanyProfile>(
    "/stock/profile2",
    { symbol: normalizeSymbol(symbol) },
    3600,
  );
  return profile && Object.keys(profile).length > 0 ? profile : null;
}

export async function getBasicMetrics(
  symbol: string,
): Promise<Record<string, number>> {
  const data = await finnhubGet<FinancialsData>(
    "/stock/metric",
    { symbol: normalizeSymbol(symbol), metric: "all" },
    3600,
  );
  return data?.metric ?? {};
}

export async function searchSymbols(
  query: string,
): Promise<FinnhubSearchResult[]> {
  const data = await finnhubGet<FinnhubSearchResponse>(
    "/search",
    // US listings only: trades are priced and settled in USD.
    { q: query, exchange: "US" },
    1800,
  );
  return Array.isArray(data?.result) ? data.result : [];
}

export async function getNews(
  symbols?: string[],
): Promise<MarketNewsArticle[]> {
  const range = getDateRange(5);
  const cleanSymbols = (symbols || [])
    .map((s) => s?.trim().toUpperCase())
    .filter((s): s is string => Boolean(s));

  const maxArticles = 6;

  // With symbols: fetch company news per symbol and pick round-robin.
  if (cleanSymbols.length > 0) {
    const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

    await Promise.all(
      cleanSymbols.map(async (sym) => {
        try {
          const articles = await finnhubGet<RawNewsArticle[]>(
            "/company-news",
            { symbol: sym, from: range.from, to: range.to },
            300,
          );
          perSymbolArticles[sym] = (articles || []).filter(validateArticle);
        } catch (e) {
          console.error("Error fetching company news for", sym, e);
          perSymbolArticles[sym] = [];
        }
      }),
    );

    const collected: MarketNewsArticle[] = [];
    for (let round = 0; round < maxArticles; round++) {
      for (let i = 0; i < cleanSymbols.length; i++) {
        const sym = cleanSymbols[i];
        const list = perSymbolArticles[sym] || [];
        if (list.length === 0) continue;
        const article = list.shift();
        if (!article || !validateArticle(article)) continue;
        collected.push(formatArticle(article, true, sym, round));
        if (collected.length >= maxArticles) break;
      }
      if (collected.length >= maxArticles) break;
    }

    if (collected.length > 0) {
      collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
      return collected.slice(0, maxArticles);
    }
  }

  // General market news fallback.
  const general = await finnhubGet<RawNewsArticle[]>(
    "/news",
    { category: "general" },
    300,
  );

  const seen = new Set<string>();
  const unique: RawNewsArticle[] = [];
  for (const art of general || []) {
    if (!validateArticle(art)) continue;
    const key = `${art.id}-${art.url}-${art.headline}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(art);
    if (unique.length >= 20) break;
  }

  return unique
    .slice(0, maxArticles)
    .map((a, idx) => formatArticle(a, false, undefined, idx));
}
