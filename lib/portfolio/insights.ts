import { formatUsd } from "@/lib/format";

export type Insight = {
  id: "all-cash" | "concentration" | "cash" | "best" | "worst" | "few-holdings";
  tone: "neutral" | "warning" | "gain" | "loss";
  title: string;
  detail: string;
  symbol?: string;
  action?: "trade";
};

type PortfolioFacts = {
  balance: number;
  totalEquity: number;
  positions: Array<{ symbol: string; marketValue: number; gainPercent: number; allocationPercent: number }>;
};

const CONCENTRATED_AT = 25; // % of equity in one holding
const pct = (n: number) => `${Math.round(n)}%`;

/**
 * Plain facts about the account, computed only from its own positions: no
 * predictions, no advice, nothing the data cannot back.
 */
export function buildInsights({ balance, totalEquity, positions }: PortfolioFacts): Insight[] {
  if (positions.length === 0) {
    return [
      {
        id: "all-cash",
        tone: "neutral",
        title: "Your account is all cash",
        detail: `${formatUsd(balance)} is ready to invest. Orders fill at the live market price.`,
        action: "trade",
      },
    ];
  }

  const insights: Insight[] = [];
  const byShare = [...positions].sort((a, b) => b.allocationPercent - a.allocationPercent);
  const largest = byShare[0];
  if (largest.allocationPercent >= CONCENTRATED_AT) {
    insights.push({
      id: "concentration",
      tone: "warning",
      title: `${largest.symbol} is ${pct(largest.allocationPercent)} of your account`,
      detail: "A single holding this large moves your whole portfolio with it.",
      symbol: largest.symbol,
    });
  }

  const cashShare = totalEquity > 0 ? (balance / totalEquity) * 100 : 0;
  if (cashShare < 5 || cashShare >= 50) {
    insights.push({
      id: "cash",
      tone: "neutral",
      title: `${pct(cashShare)} of your account is cash`,
      detail:
        cashShare < 5
          ? `${formatUsd(balance)} left to buy with. Selling frees up buying power.`
          : `${formatUsd(balance)} is uninvested and earns nothing in a paper account.`,
    });
  }

  const byGain = [...positions].sort((a, b) => b.gainPercent - a.gainPercent);
  const best = byGain[0];
  const worst = byGain[byGain.length - 1];
  if (best.gainPercent > 0) {
    insights.push({
      id: "best",
      tone: "gain",
      title: `${best.symbol} is up ${best.gainPercent.toFixed(1)}% since you bought`,
      detail: `Your best performer, worth ${formatUsd(best.marketValue)} now.`,
      symbol: best.symbol,
    });
  }
  if (worst.gainPercent < 0 && worst.symbol !== best.symbol) {
    insights.push({
      id: "worst",
      tone: "loss",
      title: `${worst.symbol} is down ${Math.abs(worst.gainPercent).toFixed(1)}% since you bought`,
      detail: `Your weakest holding, worth ${formatUsd(worst.marketValue)} now.`,
      symbol: worst.symbol,
    });
  }

  if (positions.length < 3 && insights.length < 4) {
    insights.push({
      id: "few-holdings",
      tone: "neutral",
      title: `${positions.length} ${positions.length === 1 ? "holding" : "holdings"} in your portfolio`,
      detail: "Fewer holdings means each one's swings show up more in your total.",
    });
  }

  return insights.slice(0, 4);
}
