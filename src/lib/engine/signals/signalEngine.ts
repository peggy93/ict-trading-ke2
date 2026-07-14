import type {
  Bias, Candle, IctSnapshot, MarketType, Signal, Timeframe,
} from "@/types";
import { THRESHOLDS } from "@/config";
import { uid } from "@/lib/utils";
import { computeConfidence } from "./confidence";
import { passedCount, runFilters } from "./filters";
import { buildRiskPlan } from "./risk";

export interface SignalInput {
  symbol: string;
  market: MarketType;
  timeframe: Timeframe;
  candles: Candle[];
  snapshot: IctSnapshot;
  htf: Bias;
  inKillzone: boolean;
  sessionBias: Bias;
  minConfidence?: number;
  minConfirmations?: number;
}

/**
 * Confluence signal generator. Fires only when structure + multiple aligned
 * confirmations line up and the weighted confidence clears the threshold.
 * Emits a fully-specified setup: side, entry, SL, TP1–TP3, R:R, confidence,
 * the weighted confluence breakdown, and human-readable reasons.
 */
export function generateSignal(input: SignalInput): Signal | null {
  const {
    symbol, market, timeframe, candles, snapshot, htf, inKillzone, sessionBias,
  } = input;
  const minConfidence = input.minConfidence ?? THRESHOLDS.defaultMinConfidence;
  const minConfirmations = input.minConfirmations ?? 4;

  const last = candles.at(-1);
  const lastStruct = snapshot.structure.at(-1);
  if (!last || !lastStruct) return null;

  const direction = lastStruct.direction;
  const side = direction === "bullish" ? "BUY" : "SELL";
  const price = last.close;

  // --- Institutional confirmation gate ----------------------------------
  const filters = runFilters({ candles, direction, snapshot, htf, inKillzone, sessionBias });
  const confirmations = passedCount(filters);
  if (confirmations < minConfirmations) return null;

  // --- Weighted confidence ----------------------------------------------
  const { confidence, confluence } = computeConfidence({
    direction, candles, snapshot, htf, inKillzone, sessionBias,
  });
  if (confidence < minConfidence) return null;

  // --- Reasons ----------------------------------------------------------
  const reasons: string[] = [];
  reasons.push(`${lastStruct.type} ${direction} (${lastStruct.scope}, ${lastStruct.displacement.toFixed(2)}×ATR)`);

  const sweep = snapshot.sweeps.filter((s) => s.direction === direction).at(-1);
  if (sweep) reasons.push(`${sweep.kind} of liquidity @ ${sweep.price.toFixed(2)}`);

  const ob = snapshot.orderBlocks.filter((b) => b.direction === direction && !b.mitigated)
    .sort((a, b) => b.confidence - a.confidence)[0];
  if (ob) reasons.push(`${ob.kind} order block (${ob.confidence}%)`);

  const fvg = snapshot.fvgs.filter((f) => f.direction === direction && !f.mitigated)
    .sort((a, b) => b.score - a.score)[0];
  if (fvg) reasons.push(`${fvg.kind} (score ${fvg.score}, CE ${fvg.ce.toFixed(2)})`);

  confluence.filter((c) => c.score > 0).forEach((c) => reasons.push(`✓ ${c.factor}: ${c.detail}`));
  reasons.push(`${confirmations}/${filters.length} confirmations aligned`);

  // --- Risk plan --------------------------------------------------------
  const pd = snapshot.premiumDiscount;
  const protectiveLevel = direction === "bullish"
    ? (sweep?.price ?? ob?.bottom ?? last.low)
    : (sweep?.price ?? ob?.top ?? last.high);

  const oppositeLiquidity = nearestDraw(snapshot, direction, price)
    ?? (direction === "bullish" ? pd?.rangeHigh : pd?.rangeLow);

  const plan = buildRiskPlan(candles, direction, price, protectiveLevel, {
    oppositeLiquidity: oppositeLiquidity ?? undefined,
  });

  if (plan.riskReward < THRESHOLDS.minRiskReward) return null;

  return {
    id: uid(),
    symbol, market, timeframe, side,
    entry: +plan.entry.toFixed(8),
    stopLoss: plan.stopLoss,
    takeProfit1: plan.takeProfit1,
    takeProfit2: plan.takeProfit2,
    takeProfit3: plan.takeProfit3,
    riskReward: plan.riskReward,
    confidence,
    confluence,
    reasons,
    htfBias: htf,
    createdAt: Date.now(),
  };
}

/** Nearest opposing liquidity pool as a draw-on-liquidity target. */
function nearestDraw(
  snapshot: IctSnapshot,
  direction: "bullish" | "bearish",
  price: number,
): number | undefined {
  const side = direction === "bullish" ? "buy" : "sell";
  const candidates = snapshot.liquidity
    .filter((l) => l.side === side && (direction === "bullish" ? l.price > price : l.price < price))
    .map((l) => l.price);
  if (!candidates.length) return undefined;
  return direction === "bullish" ? Math.min(...candidates) : Math.max(...candidates);
}
