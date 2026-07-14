import type { Candle } from "@/types";

const MINUTE = 60_000;

/** Precise candle factory. */
export function c(
  open: number,
  high: number,
  low: number,
  close: number,
  volume = 100,
  index = 0,
): Candle {
  return { time: index * MINUTE + 1_700_000_000_000, open, high, low, close, volume, closed: true };
}

/**
 * Build candles from a close series. High/low are padded by `spread` around
 * the max/min of consecutive closes so ATR and wicks are non-degenerate.
 */
export function candlesFromCloses(closes: number[], spread = 1, volume = 100): Candle[] {
  return closes.map((close, i) => {
    const open = i === 0 ? close : closes[i - 1]!;
    // Close-based envelope so a peak/trough close is a strict local extreme
    // (avoids adjacent-bar high/low ties that would hide fractal swings).
    const high = close + spread;
    const low = close - spread;
    return c(open, high, low, close, volume, i);
  });
}

/**
 * A clean zig-zag that trends up with unambiguous higher-highs and
 * higher-lows, spaced widely enough that fractal swings (lookback 3) are
 * detected and later up-legs close above prior swing highs (bullish BOS).
 */
export function risingZigZag(cycles = 5, base = 100, amp = 15, drift = 8): Candle[] {
  const closes: number[] = [];
  let low = base;
  for (let i = 0; i < cycles; i++) {
    const high = low + amp;
    // up leg (6 rising bars to the peak)
    for (let j = 1; j <= 6; j++) closes.push(low + ((high - low) * j) / 6);
    // down leg (5 falling bars to a higher low)
    const newLow = low + drift;
    for (let j = 1; j <= 5; j++) closes.push(high - ((high - newLow) * j) / 5);
    low = newLow;
  }
  return candlesFromCloses(closes, 0.5);
}
