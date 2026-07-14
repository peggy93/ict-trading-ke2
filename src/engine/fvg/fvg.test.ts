import { describe, expect, it } from "vitest";
import { detectFVGs } from "./index";
import { c } from "@/engine/testUtils";

describe("fvg/detectFVGs", () => {
  it("detects a bullish FVG with correct bounds and CE", () => {
    // candle-1 high = 10, candle-3 low = 12 → bullish gap 10..12, CE 11
    const candles = [
      c(9, 10, 8, 9.5, 100, 0),   // candle-1 (high 10)
      c(10, 14, 10, 13, 300, 1),  // impulse
      c(13, 15, 12, 14, 200, 2),  // candle-3 (low 12)
      c(14, 15, 13, 14.5, 120, 3),
    ];
    const fvgs = detectFVGs(candles);
    const bull = fvgs.find((f) => f.direction === "bullish" && f.kind === "FVG");
    expect(bull).toBeTruthy();
    expect(bull!.bottom).toBeCloseTo(10, 6);
    expect(bull!.top).toBeCloseTo(12, 6);
    expect(bull!.ce).toBeCloseTo(11, 6);
    expect(bull!.score).toBeGreaterThanOrEqual(0);
    expect(bull!.score).toBeLessThanOrEqual(100);
  });

  it("detects a bearish FVG", () => {
    // candle-1 low = 12, candle-3 high = 10 → bearish gap 10..12
    const candles = [
      c(13, 14, 12, 12.5, 100, 0),
      c(12, 12, 8, 9, 300, 1),
      c(9, 10, 7, 8, 200, 2),
      c(8, 9, 7, 7.5, 120, 3),
    ];
    const fvgs = detectFVGs(candles);
    expect(fvgs.some((f) => f.direction === "bearish")).toBe(true);
  });
});
