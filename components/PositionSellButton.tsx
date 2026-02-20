"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white font-medium"
      >
        Sell
      </Button>

      <TradeModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        availableBalance={availableBalance}
        defaultSymbol={symbol}
        defaultType="SELL"
        positions={[{ symbol, netQty }]}
        disableSuggestions
      />
    </>
  );
}
