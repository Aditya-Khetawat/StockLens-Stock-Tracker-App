// Display formatting shared by server and client components.

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** $1,234.56 (negative values get a leading minus sign). */
export const formatUsd = (value: number) => usd.format(value);

/** $1,235: for chart axes, where cents are noise. */
export const formatUsdWhole = (value: number) => usdWhole.format(value);

/** +$1,234.56 or −$1,234.56: the sign carries the direction, not just the colour. */
export const formatSignedUsd = (value: number) =>
  `${value >= 0 ? "+" : "−"}${usd.format(Math.abs(value))}`;

/** +1.23% or −1.23%. */
export const formatSignedPercent = (value: number) =>
  `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`;

/** Finnhub reports market capitalisation in millions of dollars: 5,167,350 → $5.17T. */
export function formatMarketCap(millions: number | null | undefined): string {
  if (!millions || !Number.isFinite(millions) || millions <= 0) return "N/A";
  if (millions >= 1_000_000) return `$${(millions / 1_000_000).toFixed(2)}T`;
  if (millions >= 1_000) return `$${(millions / 1_000).toFixed(2)}B`;
  return `$${millions.toFixed(2)}M`;
}
