import type { Candle, Direction } from "@/types";
import { atr } from "@/engine/indicators";
import { THRESHOLDS } from "@/config/constants";

export interface RiskPlan {
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskReward: number;
}

export interface TargetHints {
  /** Nearest opposite liquidity draw (used to anchor TP2 if beyond 2R). */
  oppositeLiquidity?: number;
  /** Fibonacci expansion target (used to anchor TP3 if beyond 3R). */
  expansionTarget?: number;
}

/**
 * Build a structure-anchored risk plan with a three-tier target ladder.
 *  - Stop beyond the protective level (swept level / OB edge) padded by ½×ATR.
 *  - TP1/TP2/TP3 default to 1R/2R/3R, but TP2/TP3 stretch to real liquidity /
 *    fib-expansion draws when those sit further out.
 *  - riskReward is measured to TP2 (the primary target).
 */
export function buildRiskPlan(
  candles: Candle[],
  direction: Direction,
  entry: number,
  protectiveLevel: number,
  hints: TargetHints = {},
): RiskPlan {
  const a = atr(candles, THRESHOLDS.atrPeriod).at(-1) ?? 0;
  const pad = a * 0.5;
  const stopLoss = direction === "bullish" ? protectiveLevel - pad : protectiveLevel + pad;
  const risk = Math.abs(entry - stopLoss) || 1e-9;
  const dir = direction === "bullish" ? 1 : -1;

  const tp1 = entry + dir * risk * 1;
  let tp2 = entry + dir * risk * 2;
  let tp3 = entry + dir * risk * 3;

  if (hints.oppositeLiquidity != null) {
    const draw = hints.oppositeLiquidity;
    if (dir === 1 ? draw > tp2 : draw < tp2) tp2 = draw;
  }
  if (hints.expansionTarget != null) {
    const exp = hints.expansionTarget;
    if (dir === 1 ? exp > tp3 : exp < tp3) tp3 = exp;
  }
  // Keep the ladder monotonic.
  if (dir === 1 ? tp3 <= tp2 : tp3 >= tp2) tp3 = entry + dir * risk * 3;

  const riskReward = +(Math.abs(tp2 - entry) / risk).toFixed(2);

  return {
    entry,
    stopLoss: +stopLoss.toFixed(8),
    takeProfit1: +tp1.toFixed(8),
    takeProfit2: +tp2.toFixed(8),
    takeProfit3: +tp3.toFixed(8),
    riskReward,
  };
}

/** Position size for a fixed fractional risk model. */
export function positionSize(equity: number, riskPct: number, entry: number, stop: number): number {
  const riskAmount = equity * (riskPct / 100);
  const perUnit = Math.abs(entry - stop) || 1e-9;
  return +(riskAmount / perUnit).toFixed(6);
}
