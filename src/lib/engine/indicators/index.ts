import type { Candle, Swing, VolumeProfile } from "@/types";
import { mean } from "@/utils";

/** Exponential moving average of close prices. Returns aligned array. */
export function ema(candles: Candle[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = candles[0]?.close ?? 0;
  candles.forEach((c, i) => {
    prev = i === 0 ? c.close : c.close * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

/** Simple moving average. */
export function sma(values: number[], period: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!;
    if (i >= period) sum -= values[i - period]!;
    out.push(i >= period - 1 ? sum / period : sum / (i + 1));
  }
  return out;
}

/** Wilder's ATR – the volatility yardstick used across the engine. */
export function atr(candles: Candle[], period = 14): number[] {
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    if (i === 0) { tr.push(c.high - c.low); continue; }
    const p = candles[i - 1]!;
    tr.push(Math.max(
      c.high - c.low,
      Math.abs(c.high - p.close),
      Math.abs(c.low - p.close),
    ));
  }
  const out: number[] = [];
  let prev = 0;
  tr.forEach((t, i) => {
    prev = i === 0
      ? t
      : i < period
        ? (prev * i + t) / (i + 1)
        : (prev * (period - 1) + t) / period;
    out.push(prev);
  });
  return out;
}

export function rsi(candles: Candle[], period = 14): number[] {
  let gain = 0, loss = 0;
  const out: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) { out.push(50); continue; }
    const diff = candles[i]!.close - candles[i - 1]!.close;
    const up = Math.max(diff, 0), down = Math.max(-diff, 0);
    gain = i <= period ? gain + up : (gain * (period - 1) + up) / period;
    loss = i <= period ? loss + down : (loss * (period - 1) + down) / period;
    const rs = loss === 0 ? 100 : gain / loss;
    out.push(100 - 100 / (1 + rs));
  }
  return out;
}

/**
 * Fractal swing detection with strength. A swing high has `lookback` lower
 * highs on each side (and vice-versa). `strength` is the widest symmetric
 * lookback that still holds (so major swings score higher). This is the
 * backbone of structure + liquidity.
 */
export function findSwings(candles: Candle[], lookback = 3): {
  highs: Swing[];
  lows: Swing[];
  all: Swing[];
} {
  const highs: Swing[] = [];
  const lows: Swing[] = [];

  for (let i = lookback; i < candles.length - lookback; i++) {
    const c = candles[i]!;
    let isHigh = true, isLow = true;
    for (let j = 1; j <= lookback; j++) {
      if (candles[i - j]!.high >= c.high || candles[i + j]!.high >= c.high) isHigh = false;
      if (candles[i - j]!.low <= c.low || candles[i + j]!.low <= c.low) isLow = false;
    }
    if (isHigh) highs.push({ index: i, time: c.time, price: c.high, kind: "high", strength: swingStrength(candles, i, "high") });
    if (isLow) lows.push({ index: i, time: c.time, price: c.low, kind: "low", strength: swingStrength(candles, i, "low") });
  }

  const all = [...highs, ...lows].sort((a, b) => a.index - b.index);
  return { highs, lows, all };
}

/** Widest symmetric lookback (capped) for which index i remains an extreme. */
function swingStrength(candles: Candle[], i: number, kind: "high" | "low", cap = 8): number {
  const c = candles[i]!;
  let s = 0;
  for (let j = 1; j <= cap; j++) {
    const left = candles[i - j];
    const right = candles[i + j];
    if (!left || !right) break;
    if (kind === "high") {
      if (left.high >= c.high || right.high >= c.high) break;
    } else {
      if (left.low <= c.low || right.low <= c.low) break;
    }
    s = j;
  }
  return s;
}

/**
 * Volume intelligence: relative volume, spike flag, a delta proxy (close
 * position within the bar range), cumulative delta and a short-window
 * buy/sell imbalance. Real per-trade delta is approximated because BingX kline
 * volume is not signed.
 */
export function volumeProfile(candles: Candle[], spikeMult = 1.5, window = 20): VolumeProfile | null {
  if (candles.length < window + 1) return null;
  const last = candles.at(-1)!;
  const recent = candles.slice(-window - 1, -1);
  const avg = mean(recent.map((c) => c.volume));
  const relative = avg > 0 ? last.volume / avg : 0;

  const barDelta = (c: Candle) => {
    const r = c.high - c.low || 1e-9;
    return ((c.close - c.low) / r - 0.5) * 2; // -1..1
  };

  const delta = barDelta(last);
  const cumulativeDelta = candles
    .slice(-window)
    .reduce((s, c) => s + barDelta(c) * c.volume, 0);

  const half = Math.floor(window / 2);
  const older = candles.slice(-window, -half);
  const newer = candles.slice(-half);
  const buy = newer.reduce((s, c) => s + Math.max(barDelta(c), 0) * c.volume, 0);
  const sell = older.reduce((s, c) => s + Math.max(-barDelta(c), 0) * c.volume, 0);
  const imbalance = buy + sell > 0 ? (buy - sell) / (buy + sell) : 0;

  return {
    last: last.volume,
    average: avg,
    relative,
    spike: relative >= spikeMult,
    delta,
    cumulativeDelta,
    imbalance,
  };
}
