import type { Candle, FibLevel } from "@/types";

// Re-export the primitive helpers so callers can import from a single place.
export { clamp, round, pricePrecision, uid, cn } from "@/lib/utils";

/** Arithmetic mean of a numeric array (0 for empty). */
export const mean = (xs: number[]): number =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;

/** Population standard deviation. */
export const stdev = (xs: number[]): number => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

/** Normalize a value into 0..1 given a soft ceiling. */
export const normalize = (value: number, ceiling: number): number =>
  ceiling <= 0 ? 0 : Math.min(1, Math.max(0, value / ceiling));

/** True when `price` lies within [min(a,b), max(a,b)] inclusive. */
export const inRange = (price: number, a: number, b: number): boolean =>
  price >= Math.min(a, b) && price <= Math.max(a, b);

/** Midpoint of two prices (Consequent Encroachment for gaps). */
export const midpoint = (a: number, b: number): number => (a + b) / 2;

/**
 * Build Fibonacci levels from a `low`→`high` range. When `direction` is
 * bearish the ratios are measured down from the high; bullish measures up
 * from the low. Returns price for each ratio.
 */
export function fibLevels(
  low: number,
  high: number,
  ratios: number[],
  direction: "bullish" | "bearish",
): FibLevel[] {
  const range = high - low;
  return ratios.map((ratio) => ({
    ratio,
    label: `${(ratio * 100).toFixed(1)}%`,
    price: direction === "bullish" ? high - range * ratio : low + range * ratio,
  }));
}

/** Simple candle body / range helpers used across engines. */
export const body = (c: Candle): number => Math.abs(c.close - c.open);
export const range = (c: Candle): number => Math.max(c.high - c.low, 1e-9);
export const isBull = (c: Candle): boolean => c.close >= c.open;
export const isBear = (c: Candle): boolean => c.close < c.open;
export const upperWick = (c: Candle): number => c.high - Math.max(c.open, c.close);
export const lowerWick = (c: Candle): number => Math.min(c.open, c.close) - c.low;
