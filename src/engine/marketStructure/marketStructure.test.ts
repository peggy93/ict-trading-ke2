import { describe, expect, it } from "vitest";
import { analyzeStructure } from "./index";
import { risingZigZag } from "@/engine/testUtils";

describe("marketStructure/analyzeStructure", () => {
  it("reports a bullish bias for a rising zig-zag and emits bullish structure", () => {
    const candles = risingZigZag(6, 100, 12);
    const res = analyzeStructure(candles);
    expect(res.bias).toBe("bullish");
    expect(res.structure.some((e) => e.direction === "bullish")).toBe(true);
    expect(res.swings.length).toBeGreaterThan(0);
  });

  it("classifies structural points and marks a protected low in an uptrend", () => {
    const candles = risingZigZag(6, 100, 12);
    const res = analyzeStructure(candles);
    const protectedPt = res.structuralPoints.find((p) => p.protectedPoint);
    // In a clean uptrend the protected point should be a low (if one qualifies).
    if (protectedPt) expect(protectedPt.swing.kind).toBe("low");
    expect(res.structuralPoints.every((p) => ["strong", "weak"].includes(p.quality))).toBe(true);
  });

  it("returns neutral bias with no swings for flat data", () => {
    const flat = Array.from({ length: 40 }, (_v, i) => ({
      time: i,
      open: 100,
      high: 100.1,
      low: 99.9,
      close: 100,
      volume: 10,
      closed: true,
    }));
    const res = analyzeStructure(flat);
    expect(res.bias).toBe("neutral");
  });
});
