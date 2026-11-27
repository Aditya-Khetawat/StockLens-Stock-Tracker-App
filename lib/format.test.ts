import { describe, expect, it } from "vitest";
import { formatSignedPercent, formatSignedUsd, formatUsd } from "./format";

describe("format", () => {
  it("formats dollars", () => {
    expect(formatUsd(1234.5)).toBe("$1,234.50");
  });

  it("signs gains and losses so colour is never the only cue", () => {
    expect(formatSignedUsd(12.3)).toBe("+$12.30");
    expect(formatSignedUsd(-12.3)).toBe("−$12.30");
    expect(formatSignedUsd(0)).toBe("+$0.00");
    expect(formatSignedPercent(1.234)).toBe("+1.23%");
    expect(formatSignedPercent(-0.5)).toBe("−0.50%");
  });
});
