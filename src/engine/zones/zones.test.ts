import { describe, expect, it } from "vitest";
import { premiumDiscount } from "./index";
import type { Swing } from "@/types";

const swing = (index: number, price: number, kind: "high" | "low"): Swing => ({
  index,
  time: index,
  price,
  kind,
  strength: 2,
});

describe("zones/premiumDiscount", () => {
  it("computes equilibrium as the range midpoint and splits premium/discount", () => {
    const swings = [swing(0, 100, "low"), swing(5, 200, "high")];
    const pd = premiumDiscount(swings);
    expect(pd).toBeTruthy();
    expect(pd!.equilibrium).toBeCloseTo(150, 6);
    expect(pd!.rangeHigh).toBe(200);
    expect(pd!.rangeLow).toBe(100);
    expect(pd!.premium.bottom).toBeCloseTo(150, 6);
    expect(pd!.discount.top).toBeCloseTo(150, 6);
  });

  it("places the OTE band inside the range and returns fib levels", () => {
    const swings = [swing(0, 100, "low"), swing(5, 200, "high")];
    const pd = premiumDiscount(swings)!;
    const lo = Math.min(pd.ote.top, pd.ote.bottom);
    const hi = Math.max(pd.ote.top, pd.ote.bottom);
    expect(lo).toBeGreaterThanOrEqual(100);
    expect(hi).toBeLessThanOrEqual(200);
    expect(pd.retracement.length).toBeGreaterThan(0);
    expect(pd.expansion.length).toBeGreaterThan(0);
  });

  it("returns null with fewer than two swings", () => {
    expect(premiumDiscount([swing(0, 100, "low")])).toBeNull();
  });
});
