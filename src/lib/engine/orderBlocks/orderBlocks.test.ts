import { describe, expect, it } from "vitest";
import { detectOrderBlocks } from "./index";
import { c } from "@/lib/engine/testUtils";

describe("orderBlocks/detectOrderBlocks", () => {
  it("detects a bullish order block: down candle before an up displacement", () => {
    const candles = [
      c(100, 101, 99, 100, 100, 0),
      c(100, 100.5, 99.5, 100, 100, 1),
      c(100, 100.2, 99.8, 100, 100, 2),
      c(100, 100.2, 99.0, 99.2, 120, 3), // down candle (the OB)
      c(99.2, 106, 99.1, 105.5, 400, 4), // strong up displacement
      c(105.5, 106.5, 105, 106, 150, 5),
      c(106, 107, 105.5, 106.8, 120, 6),
    ];
    const obs = detectOrderBlocks(candles);
    const bull = obs.find((b) => b.direction === "bullish");
    expect(bull).toBeTruthy();
    expect(bull!.confidence).toBeGreaterThanOrEqual(0);
    expect(bull!.confidence).toBeLessThanOrEqual(100);
    expect(bull!.factors.length).toBeGreaterThan(0);
    expect(["orderBlock", "breaker", "mitigation", "rejection", "institutional"]).toContain(bull!.kind);
  });

  it("returns no order blocks when there is no displacement", () => {
    const flat = Array.from({ length: 30 }, (_v, i) => c(100, 100.2, 99.8, 100, 100, i));
    expect(detectOrderBlocks(flat)).toHaveLength(0);
  });
});
