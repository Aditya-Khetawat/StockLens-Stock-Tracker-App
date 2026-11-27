"use client";

import { useState } from "react";
import TradeModal from "@/components/TradeModal";

/** Buy and Sell for one stock; Sell appears only when shares are held. */
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
      <button type="button" onClick={() => setOrder("BUY")} className="btn-buy min-w-24">
        Buy {symbol}
      </button>
      {ownedQty > 0 && (
        <button type="button" onClick={() => setOrder("SELL")} className="btn-sell min-w-20">
          Sell
        </button>
      )}

      <TradeModal
        // Remount per order type so the ticket opens on the button pressed.
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
