import type { ConfluenceFactor } from "@/types";

/**
 * Tunable engine configuration — the knobs that calibrate detection and
 * scoring behaviour. Static domain constants live in `@/constants`.
 */

/**
 * Weighted confluence model for the confidence engine (must sum to 1).
 * Mirrors the institutional weighting: structure & liquidity are heaviest.
 */
export const CONFLUENCE_WEIGHTS: Record<ConfluenceFactor, number> = {
  marketStructure: 0.2,
  liquidity: 0.2,
  orderBlock: 0.15,
  fvg: 0.15,
  volume: 0.1,
  session: 0.1,
  trend: 0.1,
};

/** Engine tuning thresholds — central so they are easy to calibrate. */
export const THRESHOLDS = {
  swingLookback: 3,
  internalLookback: 1,
  equalTolerance: 0.0007, // fraction of price for equal highs/lows
  displacementAtr: 1.2, // body/ATR to qualify as displacement
  institutionalAtr: 1.8, // body/ATR to qualify as institutional candle
  bodyDominance: 0.65, // body/range for clean institutional candle
  volumeSpikeMult: 1.5, // last vol / avg vol
  atrFloorPct: 0.0008, // min ATR/price to avoid dead tape
  emaTrendPeriod: 50,
  atrPeriod: 14,
  minRiskReward: 1.5,
  defaultMinConfidence: 65,
  sweepPenetrationAtr: 0.05, // min wick beyond level (ATR) to count as sweep
} as const;
