"use client";

import { useState } from "react";
import TradeModal from "@/components/TradeModal";

interface PositionSellButtonProps {
  symbol: string;
  availableBalance: number;
  netQty: number;
}

export default function PositionSellButton({
  symbol,
  availableBalance,
  netQty,
}: PositionSellButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Sell ${symbol}`}
        className="btn h-8 px-3 text-loss-soft hover:bg-loss/10"
      >
        Sell
      </button>

      <TradeModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        availableBalance={availableBalance}
        defaultSymbol={symbol}
        defaultType="SELL"
        positions={[{ symbol, netQty }]}
        lockSymbol
      />
    </>
  );
}
