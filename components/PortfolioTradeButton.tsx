"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import TradeModal from "@/components/TradeModal";
import { TrendingUp } from "lucide-react";

interface PortfolioTradeButtonProps {
  availableBalance: number;
  positions?: Array<{ symbol: string; netQty: number }>;
}

export default function PortfolioTradeButton({
  availableBalance,
  positions = [],
}: PortfolioTradeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold"
      >
        <TrendingUp className="mr-2 h-4 w-4" />
        Trade
      </Button>

      <TradeModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        availableBalance={availableBalance}
        positions={positions}
      />
    </>
  );
}
