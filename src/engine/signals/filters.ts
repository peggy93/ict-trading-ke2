import type { Bias, Candle, Direction, FilterResult, IctSnapshot } from "@/types";
import { atr, ema } from "@/engine/indicators";
import { THRESHOLDS } from "@/config/constants";
import { inRange } from "@/utils";

export interface FilterContext {
  candles: Candle[];
  direction: Direction;
  snapshot: IctSnapshot;
  htf: Bias;
  inKillzone: boolean;
  sessionBias: Bias;
}

/**
 * Institutional confirmation filters. Each returns pass/fail + weight.
 * Signals require multiple aligned confirmations (never a single condition).
 */
export function runFilters(ctx: FilterContext): FilterResult[] {
  const { candles, direction, snapshot, htf, inKillzone, sessionBias } = ctx;
  const last = candles.at(-1)!;
  const n = candles.length;
  const out: FilterResult[] = [];

  const struct = [...snapshot.structure].reverse().find((e) => e.direction === direction);
  out.push({
    name: "Structure (BOS/MSS/CHoCH)",
    passed: !!struct,
    detail: struct ? `${struct.type} ${struct.scope}` : "none",
    weight: 15,
  });

  const sweep = snapshot.sweeps.filter((s) => s.direction === direction && s.index >= n - 8).at(-1);
  out.push({
    name: "Liquidity Sweep",
    passed: !!sweep,
    detail: sweep ? `${sweep.kind} @ ${sweep.price.toFixed(2)}` : "none",
    weight: 15,
  });

  const ob = snapshot.orderBlocks.find((b) => b.direction === direction && !b.mitigated);
  out.push({
    name: "Order Block",
    passed: !!ob,
    detail: ob ? `${ob.kind} (${ob.confidence}%)` : "none",
    weight: 10,
  });

  const fvg = snapshot.fvgs.find((f) => f.direction === direction && !f.mitigated);
  out.push({
    name: "Fair Value Gap",
    passed: !!fvg,
    detail: fvg ? `${fvg.kind} (${fvg.score})` : "none",
    weight: 10,
  });

  const pd = snapshot.premiumDiscount;
  const pdOk = pd
    ? direction === "bullish" ? last.close <= pd.equilibrium : last.close >= pd.equilibrium
    : false;
  out.push({
    name: "Premium/Discount",
    passed: pdOk,
    detail: pd ? (last.close <= pd.equilibrium ? "discount" : "premium") : "n/a",
    weight: 8,
  });

  const oteOk = pd ? inRange(last.close, pd.ote.top, pd.ote.bottom) : false;
  out.push({ name: "OTE Zone", passed: oteOk, detail: oteOk ? "inside 0.62–0.79" : "outside", weight: 7 });

  const v = snapshot.volume;
  out.push({
    name: "Volume Spike",
    passed: !!v?.spike,
    detail: v ? `${v.relative.toFixed(2)}× avg` : "n/a",
    weight: 8,
  });

  const a = atr(candles, THRESHOLDS.atrPeriod).at(-1) ?? 0;
  const atrOk = last.close > 0 && a / last.close >= THRESHOLDS.atrFloorPct;
  out.push({
    name: "ATR Volatility",
    passed: atrOk,
    detail: `${((a / (last.close || 1)) * 100).toFixed(2)}%`,
    weight: 5,
  });

  const e = ema(candles, THRESHOLDS.emaTrendPeriod);
  const now = e.at(-1) ?? 0;
  const prev = e.at(-6) ?? now;
  const emaOk = direction === "bullish" ? last.close > now && now >= prev : last.close < now && now <= prev;
  out.push({ name: "EMA Trend", passed: emaOk, detail: `50EMA ${now.toFixed(2)}`, weight: 7 });

  out.push({
    name: "HTF Bias",
    passed: htf === direction,
    detail: `HTF ${htf}`,
    weight: 10,
  });

  out.push({
    name: "Session Bias",
    passed: sessionBias === direction || inKillzone,
    detail: `${inKillzone ? "killzone " : ""}session ${sessionBias}`,
    weight: 5,
  });

  return out;
}

/** Number of passing filters — used to gate low-confluence noise. */
export const passedCount = (results: FilterResult[]): number =>
  results.filter((r) => r.passed).length;
