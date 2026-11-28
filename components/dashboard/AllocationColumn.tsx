"use client";

import { useState } from "react";
import Link from "next/link";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

export type AllocationSlice = { symbol: string; value: number };

const SERIES = [
  "var(--color-series-1)",
  "var(--color-series-2)",
  "var(--color-series-3)",
  "var(--color-series-4)",
  "var(--color-series-5)",
  "var(--color-series-6)",
  "var(--color-series-7)",
];

// Cash is drawn as an empty, hatched segment: money not yet put to work.
const CASH_FILL =
  "repeating-linear-gradient(135deg, var(--color-raised) 0 5px, var(--color-line) 5px 6px)";

const pct = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

/**
 * The whole account drawn as one bar: every holding at exactly its share of
 * total equity, cash as an empty hatched segment. Hovering or focusing a segment or its
 * legend row lights up both.
 */
export default function AllocationColumn({
  slices,
  cash,
  total,
}: {
  slices: AllocationSlice[];
  cash: number;
  total: number;
}) {
  const [hot, setHot] = useState<string | null>(null);
  const holdings = [...slices].sort((a, b) => b.value - a.value);
  // Beyond seven holdings, the smallest share one "Other" segment.
  const shown = holdings.slice(0, 6);
  const rest = holdings.slice(6);
  const rows = [
    ...shown.map((s, i) => ({ key: s.symbol, label: s.symbol, value: s.value, fill: SERIES[i], href: `/stocks/${s.symbol}` })),
    ...(rest.length
      ? [{ key: "__other", label: `${rest.length} more`, value: rest.reduce((n, s) => n + s.value, 0), fill: SERIES[6], href: "/portfolio" }]
      : []),
    { key: "__cash", label: "Cash", value: cash, fill: CASH_FILL, href: undefined },
  ].filter((r) => r.value > 0);

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="sr-only">Share of total equity by holding, with cash</figcaption>

      <div
        role="img"
        aria-label={rows.map((r) => `${r.label} ${pct(r.value, total).toFixed(1)}%`).join(", ")}
        className="flex h-10 w-full gap-0.5 overflow-hidden rounded-lg"
      >
        {rows.map((r) => (
          <div
            key={r.key}
            onMouseEnter={() => setHot(r.key)}
            onMouseLeave={() => setHot(null)}
            className={cn(
              "relative h-full first:rounded-l-lg last:rounded-r-lg transition-opacity duration-200",
              hot && hot !== r.key && "opacity-35",
            )}
            style={{ width: `${pct(r.value, total)}%`, background: r.fill }}
          >
            {pct(r.value, total) >= 9 && (
              <span
                className={cn(
                  "absolute inset-y-0 left-2.5 hidden items-center text-xs font-semibold sm:flex",
                  r.key === "__cash" ? "text-fg-muted" : "text-on-brand",
                )}
              >
                {r.label}
              </span>
            )}
          </div>
        ))}
      </div>

      <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((r) => {
          const content = (
            <>
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: r.fill }}
              />
              <span className={cn("min-w-0 flex-1 truncate font-medium text-fg", r.href?.startsWith("/stocks/") && "font-mono text-[0.8125rem]")}>{r.label}</span>
              <span className="figure text-fg-muted">{pct(r.value, total).toFixed(1)}%</span>
            </>
          );
          const rowClass = cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            hot === r.key && "bg-hover",
          );
          return (
            <li
              key={r.key}
              onMouseEnter={() => setHot(r.key)}
              onMouseLeave={() => setHot(null)}
              title={formatUsd(r.value)}
            >
              {r.href ? (
                <Link
                  href={r.href}
                  className={cn(rowClass, "hover:bg-hover")}
                  onFocus={() => setHot(r.key)}
                  onBlur={() => setHot(null)}
                >
                  {content}
                </Link>
              ) : (
                <span className={rowClass}>{content}</span>
              )}
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
