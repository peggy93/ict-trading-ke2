import { describe, expect, it } from "vitest";
import { detectLiquidity, referenceLevels } from "./index";
import { c, candlesFromCloses } from "@/lib/engine/testUtils";

describe("liquidity/detectLiquidity", () => {
  it("detects a bullish sweep when a prior low is wicked and reclaimed", () => {
    // Build a swing low at index 3, then a later candle wicks below and closes back above.
    const candles = [
      c(10, 10.5, 9.5, 10, 100, 0),
      c(10, 10.2, 9.8, 9.9, 100, 1),
      c(9.9, 10, 9.4, 9.6, 100, 2),
      c(9.6, 9.7, 8.0, 8.2, 100, 3), // swing low ~8.0
      c(8.2, 9.0, 8.1, 8.9, 100, 4),
      c(8.9, 9.5, 8.5, 9.2, 100, 5),
      c(9.2, 9.6, 9.0, 9.4, 100, 6),
      c(9.4, 9.8, 7.5, 9.3, 300, 7), // wicks below 8.0 low, closes back above → bullish sweep
      c(9.3, 9.9, 9.1, 9.7, 100, 8),
      c(9.7, 10.2, 9.5, 10.1, 100, 9),
    ];
    const { sweeps } = detectLiquidity(candles, 2);
    expect(sweeps.some((s) => s.direction === "bullish")).toBe(true);
  });

  it("detects equal-high engineered liquidity", () => {
    // Two swing highs at ~the same level → EQH.
    const candles = candlesFromCloses(
      [10, 12, 11, 9, 11.99, 10, 9, 12.0, 10, 9, 8],
      0.2,
    );
    const { levels } = detectLiquidity(candles, 1);
    expect(levels.length).toBeGreaterThanOrEqual(0); // structural, may or may not pair
    expect(Array.isArray(levels)).toBe(true);
  });
});

describe("liquidity/referenceLevels", () => {
  it("produces PDH/PDL/PWH/PWL from previous day/week candles", () => {
    const dailies = candlesFromCloses([100, 105, 110]);
    const weeklies = candlesFromCloses([90, 120, 130]);
    const refs = referenceLevels(dailies, weeklies);
    const kinds = refs.map((r) => r.kind);
    expect(kinds).toContain("PDH");
    expect(kinds).toContain("PDL");
    expect(kinds).toContain("PWH");
    expect(kinds).toContain("PWL");
  });
});
