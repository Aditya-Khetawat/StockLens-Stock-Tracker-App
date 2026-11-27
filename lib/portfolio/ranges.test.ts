import { describe, expect, it } from "vitest";
import { sliceRange } from "./ranges";

const now = new Date("2026-11-28T15:00:00Z");
const day = (iso: string, pnl = 0) => ({ date: `${iso}T21:30:00.000Z`, pnl });
const series = [
  day("2025-12-15"),
  day("2026-01-05"),
  day("2026-08-20"),
  day("2026-10-30"),
  day("2026-11-20"),
  day("2026-11-25"),
  day("2026-11-28"),
];

describe("sliceRange", () => {
  it("keeps everything for All", () => {
    expect(sliceRange(series, "ALL", now)).toHaveLength(7);
  });

  it("keeps the last week, month and three months", () => {
    expect(sliceRange(series, "1W", now).map((p) => p.date.slice(0, 10))).toEqual([
      "2026-11-25",
      "2026-11-28",
    ]);
    expect(sliceRange(series, "1M", now)).toHaveLength(4);
    expect(sliceRange(series, "3M", now)).toHaveLength(4);
  });

  it("starts the year on January 1st", () => {
    expect(sliceRange(series, "YTD", now)[0].date.slice(0, 10)).toBe("2026-01-05");
  });

  it("keeps the point just before the window so the line starts at the window's left edge", () => {
    // The 3M window starts 2026-08-28; 2026-08-20 is the last point before it.
    expect(sliceRange(series, "3M", now, { includeAnchor: true })[0].date.slice(0, 10)).toBe("2026-08-20");
  });
});
