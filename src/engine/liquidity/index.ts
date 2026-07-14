import type {
  Candle, Inducement, LiquidityLevel, LiquiditySweep, Swing,
} from "@/types";
import { atr, findSwings } from "@/engine/indicators";
import { THRESHOLDS } from "@/config/constants";

export interface LiquidityResult {
  levels: LiquidityLevel[];
  sweeps: LiquiditySweep[];
  inducements: Inducement[];
}

/**
 * Liquidity engine. Detects resting & engineered pools (BSL/SSL, equal
 * highs/lows), liquidity sweeps / grabs / stop hunts, and inducement.
 */
export function detectLiquidity(
  candles: Candle[],
  lookback: number = THRESHOLDS.swingLookback,
): LiquidityResult {
  const { highs, lows, all } = findSwings(candles, lookback);
  const atrArr = atr(candles, THRESHOLDS.atrPeriod);
  const price = candles.at(-1)?.close ?? 0;

  const levels: LiquidityLevel[] = [
    ...equalPools(highs, "EQH"),
    ...equalPools(lows, "EQL"),
    ...restingPools(highs.slice(-8), "BSL", price),
    ...restingPools(lows.slice(-8), "SSL", price),
  ];

  const sweeps = detectSweeps(candles, highs, lows, atrArr, lookback);
  const inducements = detectInducements(all, sweeps);

  return { levels, sweeps, inducements };
}

/** Equal highs/lows → engineered liquidity (clusters of stops). */
function equalPools(swings: Swing[], kind: "EQH" | "EQL"): LiquidityLevel[] {
  const out: LiquidityLevel[] = [];
  const tol = THRESHOLDS.equalTolerance;
  for (let i = 1; i < swings.length; i++) {
    const a = swings[i - 1]!;
    const b = swings[i]!;
    if (Math.abs(a.price - b.price) / b.price <= tol) {
      out.push({
        kind,
        side: kind === "EQH" ? "buy" : "sell",
        price: (a.price + b.price) / 2,
        time: b.time,
        swept: false,
        quality: "engineered",
        strength: 2,
      });
    }
  }
  return out;
}

/** Unbroken swing extremes → resting liquidity (BSL above / SSL below). */
function restingPools(swings: Swing[], kind: "BSL" | "SSL", price: number): LiquidityLevel[] {
  return swings
    .filter((s) => (kind === "BSL" ? s.price > price : s.price < price))
    .map((s) => ({
      kind,
      side: kind === "BSL" ? "buy" as const : "sell" as const,
      price: s.price,
      time: s.time,
      swept: false,
      quality: "resting" as const,
      strength: Math.max(1, s.strength),
    }));
}

/**
 * Sweep detection: a wick pierces a prior swing level.
 *  - grab / stopHunt: body closes back inside (reclaimed) → reversal signal.
 *  - sweep: closes beyond the level (liquidity taken and held).
 */
export function detectSweeps(
  candles: Candle[],
  highs: Swing[],
  lows: Swing[],
  atrArr: number[],
  lookback: number,
): LiquiditySweep[] {
  const sweeps: LiquiditySweep[] = [];

  for (let i = lookback + 1; i < candles.length; i++) {
    const c = candles[i]!;
    const a = atrArr[i] || 1e-9;

    const priorHigh = highs.filter((h) => h.index < i).at(-1);
    if (priorHigh && c.high > priorHigh.price) {
      const penetration = (c.high - priorHigh.price) / a;
      if (penetration >= THRESHOLDS.sweepPenetrationAtr) {
        const reclaimed = c.close < priorHigh.price;
        sweeps.push({
          kind: reclaimed ? (penetration >= 0.75 ? "stopHunt" : "grab") : "sweep",
          direction: "bearish", // swept buy-side, expecting down
          price: priorHigh.price,
          time: c.time,
          index: i,
          penetrationAtr: +penetration.toFixed(2),
          reclaimed,
        });
      }
    }

    const priorLow = lows.filter((l) => l.index < i).at(-1);
    if (priorLow && c.low < priorLow.price) {
      const penetration = (priorLow.price - c.low) / a;
      if (penetration >= THRESHOLDS.sweepPenetrationAtr) {
        const reclaimed = c.close > priorLow.price;
        sweeps.push({
          kind: reclaimed ? (penetration >= 0.75 ? "stopHunt" : "grab") : "sweep",
          direction: "bullish", // swept sell-side, expecting up
          price: priorLow.price,
          time: c.time,
          index: i,
          penetrationAtr: +penetration.toFixed(2),
          reclaimed,
        });
      }
    }
  }

  return sweeps;
}

/**
 * Inducement: the minor liquidity that gets taken to "induce" traders before
 * the real move. For each reclaiming sweep we look for the nearest weak swing
 * between the swept level and price on the trapped side.
 */
function detectInducements(swings: Swing[], sweeps: LiquiditySweep[]): Inducement[] {
  const out: Inducement[] = [];
  for (const s of sweeps) {
    if (!s.reclaimed) continue;
    if (s.direction === "bullish") {
      // swept a low → real move up; inducement = weak low above swept level
      const iod = [...swings]
        .filter((sw) => sw.kind === "low" && sw.index < s.index && sw.price > s.price && sw.strength <= 1)
        .at(-1);
      if (iod) out.push({ direction: "bullish", price: iod.price, time: iod.time, index: iod.index });
    } else {
      const iod = [...swings]
        .filter((sw) => sw.kind === "high" && sw.index < s.index && sw.price < s.price && sw.strength <= 1)
        .at(-1);
      if (iod) out.push({ direction: "bearish", price: iod.price, time: iod.time, index: iod.index });
    }
  }
  return out;
}

/** Previous day / week high & low — major draw-on-liquidity references. */
export function referenceLevels(dailies: Candle[], weeklies: Candle[]): LiquidityLevel[] {
  const out: LiquidityLevel[] = [];
  const pd = dailies.at(-2);
  const pw = weeklies.at(-2);
  if (pd) {
    out.push(refLevel("PDH", "buy", pd.high, pd.time));
    out.push(refLevel("PDL", "sell", pd.low, pd.time));
  }
  if (pw) {
    out.push(refLevel("PWH", "buy", pw.high, pw.time));
    out.push(refLevel("PWL", "sell", pw.low, pw.time));
  }
  return out;
}

function refLevel(
  kind: LiquidityLevel["kind"],
  side: "buy" | "sell",
  price: number,
  time: number,
): LiquidityLevel {
  return { kind, side, price, time, swept: false, quality: "resting", strength: 3 };
}
