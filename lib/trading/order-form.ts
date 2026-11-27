import { formatUsd } from "@/lib/format";
import { roundMoney } from "@/lib/trading/money";
import { MAX_TRADE_QUANTITY } from "@/lib/trading/validation";

export type OrderCheck =
  | { ok: true; quantity: number; total: number }
  | { ok: false; message: string };

/**
 * Validate the trade form before it is sent. The server repeats every check
 * inside the trade transaction; this only lets the form explain problems early.
 */
export function checkOrder(input: {
  type: "BUY" | "SELL";
  quantity: string;
  price: number | null;
  cash: number;
  ownedQty: number;
}): OrderCheck {
  const raw = input.quantity.trim();
  if (!raw) return { ok: false, message: "Enter a quantity." };

  const quantity = Number(raw);
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) {
    return { ok: false, message: "Quantity must be a whole number." };
  }
  if (quantity < 1) return { ok: false, message: "Quantity must be at least 1." };
  if (quantity > MAX_TRADE_QUANTITY) {
    return { ok: false, message: `Quantity cannot exceed ${MAX_TRADE_QUANTITY}.` };
  }

  if (input.type === "SELL") {
    if (input.ownedQty <= 0) return { ok: false, message: "You don't own this stock." };
    if (quantity > input.ownedQty) {
      return { ok: false, message: `You own ${input.ownedQty} share${input.ownedQty === 1 ? "" : "s"}.` };
    }
  }

  if (!input.price) return { ok: false, message: "Waiting for a live price." };
  const total = roundMoney(quantity * input.price);

  if (input.type === "BUY" && total > input.cash) {
    return {
      ok: false,
      message: `Not enough cash: this order costs ${formatUsd(total)} and you have ${formatUsd(input.cash)}.`,
    };
  }
  return { ok: true, quantity, total };
}
