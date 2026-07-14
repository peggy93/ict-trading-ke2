import { describe, expect, it } from "vitest";
import { atr, ema, findSwings, rsi, volumeProfile } from "./index";
import { c, candlesFromCloses } from "@/lib/engine/testUtils";

describe("indicators/ema", () => {
  it("returns an aligned array", () => {
    const candles = candlesFromCloses([1, 2, 3, 4, 5]);
    expect(ema(candles, 3)).toHaveLength(5);
  });

  it("equals the constant value for flat closes", () => {
    const candles = candlesFromCloses([10, 10, 10, 10, 10]);
    const e = ema(candles, 3);
    expect(e.at(-1)).toBeCloseTo(10, 6);
  });
});

describe("indicators/atr", () => {
  it("is positive for candles with range", () => {
    const candles = candlesFromCloses([10, 12, 11, 13, 12, 14], 2);
    expect(atr(candles, 3).at(-1)!).toBeGreaterThan(0);
  });
});

describe("indicators/rsi", () => {
  it("stays within 0..100", () => {
    const candles = candlesFromCloses([10, 11, 9, 12, 8, 13, 7, 14]);
    for (const v of rsi(candles, 5)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe("indicators/findSwings", () => {
  it("detects an obvious swing high and low", () => {
    // index 3 is a clear high, index 7 a clear low (lookback 2)
    const candles = [
      c(1, 2, 0.5, 1.5, 100, 0),
      c(1.5, 2.5, 1, 2, 100, 1),
      c(2, 3, 1.5, 2.5, 100, 2),
      c(2.5, 6, 2, 5.5, 100, 3), // high
      c(5.5, 5.8, 4, 4.2, 100, 4),
      c(4.2, 4.5, 3, 3.2, 100, 5),
      c(3.2, 3.4, 2, 2.1, 100, 6),
      c(2.1, 2.3, 0.2, 0.5, 100, 7), // low
      c(0.5, 1.5, 0.4, 1.2, 100, 8),
      c(1.2, 2.5, 1, 2.2, 100, 9),
      c(2.2, 3.5, 2, 3.2, 100, 10),
    ];
    const { highs, lows } = findSwings(candles, 2);
    expect(highs.some((h) => h.index === 3)).toBe(true);
    expect(lows.some((l) => l.index === 7)).toBe(true);
  });
});

describe("indicators/volumeProfile", () => {
  it("returns null when too few candles", () => {
    expect(volumeProfile(candlesFromCloses([1, 2, 3]))).toBeNull();
  });

  it("flags a volume spike", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + (i % 3));
    const candles = candlesFromCloses(closes, 1, 100);
    candles[candles.length - 1]!.volume = 1000; // spike on last bar
    const vp = volumeProfile(candles, 1.5, 20);
    expect(vp?.spike).toBe(true);
    expect(vp!.relative).toBeGreaterThan(1.5);
  });
});
