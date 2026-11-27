import { describe, expect, it } from "vitest";
import { roundMoney } from "./money";

describe("roundMoney", () => {
  it("removes floating-point noise", () => {
    expect(roundMoney(97688.73000000001)).toBe(97688.73);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it("rounds half-cents up", () => {
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(2.675)).toBe(2.68);
  });

  it("keeps whole-cent values unchanged", () => {
    expect(roundMoney(355.58)).toBe(355.58);
    expect(roundMoney(100000)).toBe(100000);
  });
});
