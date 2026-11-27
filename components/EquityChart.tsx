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
import { Loader2, TrendingUp } from "lucide-react";

interface PnLDataPoint {
  date: string;
  pnl: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

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
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
      <p className="text-xs text-gray-400 mb-1">{formattedDate}</p>
      <p className={`text-sm font-semibold ${pnlValue >= 0 ? "text-green-500" : "text-red-500"}`}>
        {formatCurrency(pnlValue)}
      </p>
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
      <div className="flex items-center justify-center h-62.5 bg-gray-800 border border-gray-600 rounded-lg">
        <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-62.5 bg-gray-800 border border-gray-600 rounded-lg">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  // A line needs two points; history grows by one point per market close.
  if (data.length < 2) {
    const current = data[0]?.pnl ?? 0;
    return (
      <div className="flex flex-col items-center justify-center h-62.5 bg-gray-800 border border-gray-600 rounded-lg space-y-2 px-6 text-center">
        <TrendingUp className="h-10 w-10 text-gray-600" aria-hidden="true" />
        <p className={`text-2xl font-semibold tabular-nums ${current >= 0 ? "text-green-500" : "text-red-500"}`}>
          {current >= 0 ? "+" : ""}
          {formatCurrency(current)}
        </p>
        <p className="text-gray-400 text-sm">
          Profit &amp; loss so far. Your history chart fills in after each market close.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 md:p-6">
      <h3 className="text-base md:text-lg font-semibold text-gray-100 mb-4">
        Profit &amp; Loss Over Time
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 8, left: 0, bottom: 5 }}
        >
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            tickLine={false}
            tick={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            stroke="#9ca3af"
            style={{ fontSize: "11px" }}
            tickLine={false}
            axisLine={false}
            width={58}
          />
          <Tooltip content={<PnLTooltip />} />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
