import { z } from "zod";

export const MAX_TRADE_QUANTITY = 1_000_000;

const tradeRequestSchema = z.object({
  symbol: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9.\-]{1,15}$/, "Invalid symbol."),
  type: z.enum(["BUY", "SELL"], { error: "Type must be BUY or SELL." }),
  quantity: z
    .number({ error: "Quantity must be a number." })
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(MAX_TRADE_QUANTITY, `Quantity cannot exceed ${MAX_TRADE_QUANTITY}.`),
});

export type TradeRequest = z.infer<typeof tradeRequestSchema>;

export function parseTradeRequest(
  input: unknown,
): { success: true; data: TradeRequest } | { success: false; error: string } {
  const result = tradeRequestSchema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return {
    success: false,
    error: result.error.issues[0]?.message ?? "Invalid trade request.",
  };
}
