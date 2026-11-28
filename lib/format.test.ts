import { describe, expect, it } from "vitest";
import { changeDirection, formatMarketCap, formatSignedPercent, formatSignedUsd, formatUsd, formatUsdWhole } from "./format";

describe("format", () => {
  it("formats dollars", () => {
    expect(formatUsd(1234.5)).toBe("$1,234.50");
  });

  it("formats market caps from Finnhub's millions of dollars", () => {
    expect(formatMarketCap(5_167_350)).toBe("$5.17T");
    expect(formatMarketCap(98_765)).toBe("$98.77B");
    expect(formatMarketCap(450.5)).toBe("$450.50M");
    expect(formatMarketCap(0)).toBe("N/A");
    expect(formatMarketCap(undefined)).toBe("N/A");
  });

  it("formats whole dollars for chart axes", () => {
    expect(formatUsdWhole(1234.5)).toBe("$1,235");
    expect(formatUsdWhole(-80.2)).toBe("-$80");
  });

  it("signs gains and losses so colour is never the only cue", () => {
    expect(formatSignedUsd(12.3)).toBe("+$12.30");
    expect(formatSignedUsd(-12.3)).toBe("−$12.30");
    expect(formatSignedPercent(1.234)).toBe("+1.23%");
    expect(formatSignedPercent(-0.5)).toBe("−0.50%");
  });

  it("leaves no change unsigned, including amounts too small to show", () => {
    expect(formatSignedUsd(0)).toBe("$0.00");
    expect(formatSignedUsd(-0.004)).toBe("$0.00");
    expect(formatSignedUsd(0.005)).toBe("+$0.01");
    expect(formatSignedPercent(0)).toBe("0.00%");
    expect(formatSignedPercent(-0.001)).toBe("0.00%");
  });

  it("calls a change flat when it rounds to zero", () => {
    expect(changeDirection(12.3)).toBe("up");
    expect(changeDirection(-0.01)).toBe("down");
    expect(changeDirection(0)).toBe("flat");
    expect(changeDirection(0.004)).toBe("flat");
    expect(changeDirection(-0.004)).toBe("flat");
  });
});
