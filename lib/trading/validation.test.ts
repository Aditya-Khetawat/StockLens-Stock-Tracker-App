import { describe, expect, it } from "vitest";
import { parseTradeRequest, MAX_TRADE_QUANTITY } from "./validation";

describe("parseTradeRequest", () => {
  it("accepts a valid order and normalizes the symbol", () => {
    const result = parseTradeRequest({ symbol: " aapl ", type: "BUY", quantity: 5 });
    expect(result).toEqual({
      success: true,
      data: { symbol: "AAPL", type: "BUY", quantity: 5 },
    });
  });

  it("rejects fractional quantities", () => {
    const result = parseTradeRequest({ symbol: "AAPL", type: "BUY", quantity: 1.5 });
    expect(result.success).toBe(false);
  });

  it("rejects zero, negative and oversized quantities", () => {
    for (const quantity of [0, -3, MAX_TRADE_QUANTITY + 1]) {
      expect(parseTradeRequest({ symbol: "AAPL", type: "BUY", quantity }).success).toBe(false);
    }
  });

  it("rejects symbols with characters a ticker cannot contain", () => {
    for (const symbol of ["", "AAPL;DROP", "../etc", "A".repeat(16)]) {
      expect(parseTradeRequest({ symbol, type: "SELL", quantity: 1 }).success).toBe(false);
    }
  });

  it("rejects unknown order types", () => {
    expect(parseTradeRequest({ symbol: "AAPL", type: "SHORT", quantity: 1 }).success).toBe(false);
  });

  it("returns a readable error message", () => {
    const result = parseTradeRequest({ symbol: "AAPL", type: "BUY", quantity: 1.5 });
    expect(result.success === false && result.error).toMatch(/whole number/i);
  });
});
