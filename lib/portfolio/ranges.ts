export const RANGES = ["1W", "1M", "3M", "YTD", "ALL"] as const;
export type Range = (typeof RANGES)[number];

function rangeStart(range: Range, now: Date): Date | null {
  const d = new Date(now);
  switch (range) {
    case "1W":
      d.setUTCDate(d.getUTCDate() - 7);
      return d;
    case "1M":
      d.setUTCMonth(d.getUTCMonth() - 1);
      return d;
    case "3M":
      d.setUTCMonth(d.getUTCMonth() - 3);
      return d;
    case "YTD":
      return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    case "ALL":
      return null;
  }
}

/**
 * The part of a dated series inside a time range. With includeAnchor, the last
 * point before the window is kept too, so a chart's line starts at the window
 * edge instead of mid-air.
 */
export function sliceRange<T extends { date: string }>(
  series: T[],
  range: Range,
  now: Date = new Date(),
  { includeAnchor = false }: { includeAnchor?: boolean } = {},
): T[] {
  const start = rangeStart(range, now);
  if (!start) return series;
  const from = series.findIndex((p) => new Date(p.date) >= start);
  if (from === -1) return series.slice(-1);
  return series.slice(includeAnchor && from > 0 ? from - 1 : from);
}
