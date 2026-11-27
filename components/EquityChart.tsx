"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import ChangeText from "@/components/ChangeText";
import { formatUsdWhole } from "@/lib/format";
import { Skeleton } from "@/components/Skeleton";

interface PnLDataPoint {
  date: string;
  pnl: number;
}


type PnLTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number; payload: PnLDataPoint }>;
};

function PnLTooltip({ active, payload }: PnLTooltipProps) {
  if (!active || !payload?.length) return null;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(payload[0].payload.date));
  const pnlValue = payload[0].value ?? 0;

  return (
    <div className="bg-surface border border-line rounded-lg p-3 shadow-lg">
      <p className="text-xs text-fg-muted mb-1">{formattedDate}</p>
      <ChangeText value={pnlValue} className="text-sm font-semibold" />
    </div>
  );
}

export default function EquityChart() {
  const [data, setData] = useState<PnLDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPnLData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/portfolio/equity", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch PnL data");
        }

        const pnlData = await response.json();
        setData(pnlData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchPnLData();
  }, []);

  if (loading) {
    return (
      <div
        className="h-62.5 bg-surface border border-line rounded-lg p-4 md:p-6 flex flex-col gap-4"
        aria-busy="true"
        aria-label="Loading profit and loss"
      >
        <Skeleton className="h-5 w-48" />
        <Skeleton className="flex-1" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-62.5 bg-surface border border-line rounded-lg">
        <p className="text-loss text-sm">{error}</p>
      </div>
    );
  }

  // A line needs two points; history grows by one point per market close.
  if (data.length < 2) {
    const current = data[0]?.pnl ?? 0;
    return (
      <div className="flex flex-col items-center justify-center h-62.5 bg-surface border border-line rounded-lg space-y-2 px-6 text-center">
        <TrendingUp className="h-10 w-10 text-line" aria-hidden="true" />
        <ChangeText value={current} className="text-2xl font-semibold" />
        <p className="text-fg-muted text-sm">
          Profit &amp; loss so far. Your history chart fills in after each market close.
        </p>
      </div>
    );
  }

  // Green while the portfolio is up overall, red while it is down.
  const lineColor = data[data.length - 1].pnl >= 0 ? "var(--color-gain)" : "var(--color-loss)";

  return (
    <div className="bg-surface border border-line rounded-lg p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold text-fg mb-4">
        Profit &amp; Loss Over Time
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 8, left: 0, bottom: 5 }}
        >
          <XAxis
            dataKey="date"
            stroke="var(--color-fg-subtle)"
            tickLine={false}
            tick={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatUsdWhole}
            stroke="var(--color-fg-subtle)"
            style={{ fontSize: "11px", fontVariantNumeric: "tabular-nums" }}
            tickLine={false}
            axisLine={false}
            width={58}
          />
          <Tooltip content={<PnLTooltip />} />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
