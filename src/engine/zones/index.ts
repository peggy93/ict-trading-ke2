import type { PremiumDiscount, Swing } from "@/types";
import { FIB_EXPANSION, FIB_RETRACEMENT, OTE_BAND } from "@/config/constants";
import { fibLevels } from "@/utils";

/**
 * Premium/Discount + OTE + Fibonacci engine.
 *
 * Uses the most recent significant dealing range (major swing high ↔ low).
 *  - Above equilibrium (50%) = premium → favor selling.
 *  - Below equilibrium       = discount → favor buying.
 *  - OTE = 62%–79% retracement of the impulse — the prime entry band.
 *  - Retracement + expansion fib levels are projected for targets/entries.
 */
export function premiumDiscount(swings: Swing[]): PremiumDiscount | null {
  if (swings.length < 2) return null;

  const recent = swings.slice(-10);
  const highSwing = recent.reduce((a, b) => (b.price > a.price ? b : a));
  const lowSwing = recent.reduce((a, b) => (b.price < a.price ? b : a));
  const high = highSwing.price;
  const low = lowSwing.price;
  if (high <= low) return null;

  // Impulse direction: whichever extreme formed most recently anchors the fib.
  const direction = highSwing.index >= lowSwing.index ? "bullish" : "bearish";
  const eq = (high + low) / 2;
  const range = high - low;

  const ote = direction === "bullish"
    ? { top: high - range * OTE_BAND.start, bottom: high - range * OTE_BAND.end }
    : { top: low + range * OTE_BAND.end, bottom: low + range * OTE_BAND.start };

  return {
    equilibrium: eq,
    rangeHigh: high,
    rangeLow: low,
    direction,
    premium: { top: high, bottom: eq },
    discount: { top: eq, bottom: low },
    ote,
    retracement: fibLevels(low, high, FIB_RETRACEMENT, direction),
    expansion: fibLevels(low, high, FIB_EXPANSION, direction),
  };
}
