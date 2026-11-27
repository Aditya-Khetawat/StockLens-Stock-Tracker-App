"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import ChangeText from "@/components/ChangeText";
import { Skeleton } from "@/components/Skeleton";
import { formatSignedUsd, formatUsdWhole } from "@/lib/format";
import { RANGES, sliceRange, type Range } from "@/lib/portfolio/ranges";
import { cn } from "@/lib/utils";

type Point = { date: string; pnl: number };

const dateLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const tickLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function PnLTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Point }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 shadow-[var(--shadow-pop)]">
      <p className="text-xs text-fg-subtle">{dateLabel.format(new Date(p.date))}</p>
      <p className="mt-0.5 text-xs text-fg-muted">Profit &amp; loss</p>
      <ChangeText value={p.pnl} className="text-sm font-semibold" />
    </div>
  );
}

/**
 * Profit and loss over time from the daily equity snapshots, with ranges.
 * `bare` renders without its own sheet, for embedding in a larger panel.
 */
export default function EquityChart({ bare = false }: { bare?: boolean }) {
  const [data, setData] = useState<Point[] | null>(null);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<Range>("ALL");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portfolio/equity", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Point[]) => !cancelled && setData(d))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(() => (data ? sliceRange(data, range, new Date(), { includeAnchor: true }) : []), [data, range]);
  const change = shown.length >= 2 ? shown[shown.length - 1].pnl - shown[0].pnl : 0;
  const up = change >= 0;
  const stroke = up ? "var(--color-gain)" : "var(--color-loss)";

  const frame = (body: React.ReactNode) =>
    bare ? <div className="flex flex-col gap-3">{body}</div> : <section className="sheet flex flex-col gap-3 p-5">{body}</section>;

  if (error) {
    return frame(
      <p className="flex h-56 items-center justify-center text-sm text-fg-subtle">
        Performance history is unavailable right now.
      </p>,
    );
  }
  if (!data) {
    return frame(
      <div aria-busy="true" aria-label="Loading performance" className="flex h-64 flex-col gap-3">
        <Skeleton className="h-7 w-60" />
        <Skeleton className="flex-1" />
      </div>,
    );
  }

  // A line needs two points; history grows by one point per market close.
  if (data.length < 2) {
    return frame(
      <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-6 text-center">
        <LineChartIcon className="h-6 w-6 text-fg-subtle" aria-hidden="true" />
        <p className="text-sm font-medium text-fg">Your performance chart starts after the next market close</p>
        <p className="max-w-sm text-sm text-fg-subtle">
          StockLens records your account value after each US market close, so the line grows by one point every trading day.
        </p>
      </div>,
    );
  }

  return frame(
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-baseline gap-2 text-sm">
          <ChangeText value={change} className="font-semibold" />
          <span className="text-fg-subtle">{range === "ALL" ? "since you started" : `over ${range === "YTD" ? "the year" : range}`}</span>
        </p>
        <div role="group" aria-label="Time range" className="flex rounded-lg bg-raised p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => setRange(r)}
              className={cn(
                "h-7 cursor-pointer rounded-md px-2.5 text-xs font-semibold transition-colors",
                range === r ? "bg-surface text-fg" : "text-fg-subtle hover:text-fg",
              )}
            >
              {r === "ALL" ? "All" : r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56 md:h-64" role="img" aria-label={`Profit and loss chart, ${formatSignedUsd(change)} over the selected range`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={shown} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => tickLabel.format(new Date(d))}
              tick={{ fill: "var(--color-fg-subtle)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={48}
            />
            <YAxis
              tickFormatter={formatUsdWhole}
              tick={{ fill: "var(--color-fg-subtle)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={64}
              orientation="right"
            />
            <Tooltip content={<PnLTooltip />} cursor={{ stroke: "var(--color-line-strong)", strokeDasharray: "3 3" }} />
            <Area
              type="monotone"
              dataKey="pnl"
              stroke={stroke}
              strokeWidth={2}
              fill="url(#pnlFill)"
              activeDot={{ r: 4, fill: stroke, stroke: "var(--color-surface)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>,
  );
}
