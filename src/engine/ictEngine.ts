import type { Bias, Candle, IctSnapshot, Timeframe } from "@/types";
import { MIN_CANDLES_FOR_ANALYSIS, TF_WEIGHT, TIMEFRAMES } from "@/config/constants";
import { analyzeStructure } from "./marketStructure";
import { detectLiquidity } from "./liquidity";
import { detectFVGs } from "./fvg";
import { detectOrderBlocks } from "./orderBlocks";
import { premiumDiscount } from "./zones";
import { detectDisplacement } from "./displacement";
import { volumeProfile } from "./indicators";

/**
 * Run the full ICT/SMC stack on one timeframe's candles and return an
 * immutable snapshot. Pure + synchronous so it can run on the main thread or
 * be offloaded to a worker.
 */
export function runIct(timeframe: Timeframe, candles: Candle[]): IctSnapshot {
  if (candles.length < MIN_CANDLES_FOR_ANALYSIS) {
    return emptySnapshot(timeframe);
  }

  const structure = analyzeStructure(candles);
  const fvgs = detectFVGs(candles);
  const { levels, sweeps, inducements } = detectLiquidity(candles);
  const orderBlocks = detectOrderBlocks(candles, {
    fvgs,
    sweeps,
    structure: structure.structure,
  });

  return {
    timeframe,
    bias: structure.bias,
    swings: structure.swings,
    structuralPoints: structure.structuralPoints,
    structure: structure.structure,
    fvgs,
    orderBlocks,
    liquidity: levels,
    sweeps,
    inducements,
    premiumDiscount: premiumDiscount(structure.swings),
    displacement: detectDisplacement(candles),
    volume: volumeProfile(candles),
  };
}

function emptySnapshot(timeframe: Timeframe): IctSnapshot {
  return {
    timeframe,
    bias: "neutral",
    swings: [],
    structuralPoints: [],
    structure: [],
    fvgs: [],
    orderBlocks: [],
    liquidity: [],
    sweeps: [],
    inducements: [],
    premiumDiscount: null,
    displacement: [],
    volume: null,
  };
}

export interface HtfBiasResult {
  bias: Bias;
  score: number;
  votes: Partial<Record<Timeframe, Bias>>;
}

/**
 * Higher-Time-Frame bias cascade. Weights higher timeframes more heavily and
 * returns a net directional bias plus the raw per-TF votes for display. Higher
 * timeframes therefore influence lower-timeframe signal generation.
 */
export function htfBias(snapshots: Partial<Record<Timeframe, IctSnapshot>>): HtfBiasResult {
  let score = 0;
  const votes: Partial<Record<Timeframe, Bias>> = {};

  for (const tf of TIMEFRAMES) {
    const snap = snapshots[tf];
    if (!snap) continue;
    votes[tf] = snap.bias;
    if (snap.bias === "bullish") score += TF_WEIGHT[tf];
    else if (snap.bias === "bearish") score -= TF_WEIGHT[tf];
  }

  const bias: Bias = score > 1 ? "bullish" : score < -1 ? "bearish" : "neutral";
  return { bias, score: +score.toFixed(2), votes };
}
