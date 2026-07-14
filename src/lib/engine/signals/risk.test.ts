import { describe, expect, it } from "vitest";
import { buildRiskPlan, positionSize } from "./risk";
import { candlesFromCloses } from "@/lib/engine/testUtils";

describe("signals/risk/buildRiskPlan", () => {
  const candles = candlesFromCloses(
    Array.from({ length: 30 }, (_v, i) => 100 + Math.sin(i) * 2),
    1,
  );

  it("places SL below entry and TP ladder above for a long", () => {
    const plan = buildRiskPlan(candles, "bullish", 100, 98);
    expect(plan.stopLoss).toBeLessThan(100);
    expect(plan.takeProfit1).toBeGreaterThan(100);
    expect(plan.takeProfit2).toBeGreaterThan(plan.takeProfit1);
    expect(plan.takeProfit3).toBeGreaterThan(plan.takeProfit2);
    expect(plan.riskReward).toBeGreaterThan(0);
  });

  it("places SL above entry and TP ladder below for a short", () => {
    const plan = buildRiskPlan(candles, "bearish", 100, 102);
    expect(plan.stopLoss).toBeGreaterThan(100);
    expect(plan.takeProfit1).toBeLessThan(100);
    expect(plan.takeProfit2).toBeLessThan(plan.takeProfit1);
    expect(plan.takeProfit3).toBeLessThan(plan.takeProfit2);
  });

  it("stretches TP2 to a further opposite-liquidity draw", () => {
    const plan = buildRiskPlan(candles, "bullish", 100, 98, { oppositeLiquidity: 130 });
    expect(plan.takeProfit2).toBeCloseTo(130, 6);
  });
});

describe("signals/risk/positionSize", () => {
  it("sizes by fixed fractional risk", () => {
    // 1% of 10,000 = 100 risk; 2 per unit → 50 units
    expect(positionSize(10_000, 1, 100, 98)).toBeCloseTo(50, 6);
  });
});
