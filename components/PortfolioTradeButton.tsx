"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import TradeModal from "@/components/TradeModal";

interface PortfolioTradeButtonProps {
  availableBalance: number;
  positions?: Array<{ symbol: string; netQty: number }>;
  /** "secondary" when another gold action already leads the view. */
  variant?: "primary" | "secondary";
}

/** Opens the order ticket: the primary action of most views. */
export default function PortfolioTradeButton({
  availableBalance,
  positions = [],
  variant = "primary",
}: PortfolioTradeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className={variant === "primary" ? "btn-primary" : "btn-secondary"}>
        <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
        Trade
      </button>

      <TradeModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        availableBalance={availableBalance}
        positions={positions}
      />
    </>
  );
}
