import { describe, expect, it } from "vitest";
import { checkOrder } from "./order-form";

const base = { price: 50, cash: 1_000, ownedQty: 10 };

describe("checkOrder", () => {
  it("accepts an affordable buy and reports its total", () => {
    expect(checkOrder({ ...base, type: "BUY", quantity: "4" })).toEqual({ ok: true, quantity: 4, total: 200 });
  });

  it("rounds the total to cents", () => {
    expect(checkOrder({ ...base, price: 355.58, cash: 10_000, type: "BUY", quantity: "3" })).toMatchObject({ total: 1066.74 });
  });

  it.each([
    ["", "Enter a quantity."],
    ["0", "Quantity must be at least 1."],
    ["-2", "Quantity must be at least 1."],
    ["1.5", "Quantity must be a whole number."],
    ["abc", "Quantity must be a whole number."],
    ["2000000", "Quantity cannot exceed 1000000."],
  ])("rejects quantity %j", (quantity, message) => {
    expect(checkOrder({ ...base, type: "BUY", quantity })).toEqual({ ok: false, message });
  });

  it("rejects a buy that costs more than the cash balance", () => {
    expect(checkOrder({ ...base, type: "BUY", quantity: "21" })).toEqual({
      ok: false,
      message: "Not enough cash: this order costs $1,050.00 and you have $1,000.00.",
    });
  });

  it("rejects selling more shares than are owned", () => {
    expect(checkOrder({ ...base, type: "SELL", quantity: "11" })).toEqual({
      ok: false,
      message: "You own 10 shares.",
    });
    expect(checkOrder({ ...base, ownedQty: 0, type: "SELL", quantity: "1" })).toEqual({
      ok: false,
      message: "You don't own this stock.",
    });
  });

  it("allows selling more than the cash balance is worth", () => {
    expect(checkOrder({ ...base, cash: 0, type: "SELL", quantity: "10" })).toEqual({ ok: true, quantity: 10, total: 500 });
  });

  it("waits for a price before validating amounts", () => {
    expect(checkOrder({ ...base, price: null, type: "BUY", quantity: "1" })).toEqual({ ok: false, message: "Waiting for a live price." });
  });
});
