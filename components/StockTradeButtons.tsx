"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import TradeModal from "@/components/TradeModal";

/** Buy and Sell buttons for one stock; Sell appears only when shares are held. */
export default function StockTradeButtons({
  symbol,
  cash,
  ownedQty,
}: {
  symbol: string;
  cash: number;
  ownedQty: number;
}) {
  const [order, setOrder] = useState<"BUY" | "SELL" | null>(null);

  return (
    <>
      <Button
        onClick={() => setOrder("BUY")}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold"
      >
        Buy {symbol}
      </Button>
      {ownedQty > 0 && (
        <Button
          onClick={() => setOrder("SELL")}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          Sell
        </Button>
      )}

      <TradeModal
        // Remount per order type so the dialog opens on the button pressed.
        key={order ?? "closed"}
        open={order !== null}
        onClose={() => setOrder(null)}
        availableBalance={cash}
        defaultSymbol={symbol}
        defaultType={order ?? "BUY"}
        positions={[{ symbol, netQty: ownedQty }]}
        lockSymbol
      />
    </>
  );
}
