import type {
  Bias, Candle, ConfluenceFactor, ConfluenceScore, Direction, IctSnapshot,
} from "@/types";
import { CONFLUENCE_WEIGHTS } from "@/config/constants";
import { ema } from "@/engine/indicators";
import { clamp, inRange } from "@/utils";

export interface ConfidenceInput {
  direction: Direction;
  candles: Candle[];
  snapshot: IctSnapshot;
  htf: Bias;
  inKillzone: boolean;
  sessionBias: Bias;
}

/**
 * Weighted "AI" confidence engine. Each confluence factor is scored 0..1 and
 * multiplied by its configured weight; the sum × 100 is the final confidence.
 * Weights follow the institutional model (structure/liquidity heaviest).
 */
export function computeConfidence(input: ConfidenceInput): {
  confidence: number;
  confluence: ConfluenceScore[];
} {
  const { direction, candles, snapshot, htf, inKillzone, sessionBias } = input;
  const price = candles.at(-1)?.close ?? 0;
  const n = candles.length;

  const scores: Record<ConfluenceFactor, { score: number; detail: string }> = {
    marketStructure: scoreStructure(snapshot, direction),
    liquidity: scoreLiquidity(snapshot, direction, n),
    orderBlock: scoreOrderBlock(snapshot, direction),
    fvg: scoreFvg(snapshot, direction),
    volume: scoreVolume(snapshot, direction),
    session: scoreSession(inKillzone, sessionBias, direction),
    trend: scoreTrend(candles, direction, htf),
  };

  const confluence: ConfluenceScore[] = (Object.keys(CONFLUENCE_WEIGHTS) as ConfluenceFactor[]).map(
    (factor) => ({
      factor,
      weight: CONFLUENCE_WEIGHTS[factor],
      score: +scores[factor].score.toFixed(2),
      detail: scores[factor].detail,
    }),
  );

  const confidence = Math.round(
    confluence.reduce((s, c) => s + c.weight * c.score, 0) * 100,
  );

  // Premium/discount context nudges (documented, small).
  const pd = snapshot.premiumDiscount;
  let adj = 0;
  if (pd) {
    const inDiscount = price <= pd.equilibrium;
    if ((direction === "bullish" && inDiscount) || (direction === "bearish" && !inDiscount)) adj += 3;
    if (inRange(price, pd.ote.top, pd.ote.bottom)) adj += 3;
  }

  return { confidence: clamp(confidence + adj, 0, 100), confluence };
}

function scoreStructure(s: IctSnapshot, dir: Direction) {
  const last = [...s.structure].reverse().find((e) => e.direction === dir);
  if (!last) return { score: 0, detail: "no aligned structure" };
  const score = last.type === "MSS" ? 1 : last.type === "CHoCH" ? 0.8 : 0.6;
  return { score, detail: `${last.type} ${dir} (${last.scope})` };
}

function scoreLiquidity(s: IctSnapshot, dir: Direction, n: number) {
  const sweep = [...s.sweeps]
    .filter((sw) => sw.direction === dir && sw.index >= n - 8)
    .at(-1);
  if (!sweep) return { score: 0, detail: "no recent sweep" };
  const base = sweep.reclaimed ? 1 : 0.6;
  return { score: base, detail: `${sweep.kind} @ ${sweep.price.toFixed(2)}` };
}

function scoreOrderBlock(s: IctSnapshot, dir: Direction) {
  const ob = s.orderBlocks
    .filter((b) => b.direction === dir && !b.mitigated)
    .sort((a, b) => b.confidence - a.confidence)[0];
  if (!ob) return { score: 0, detail: "no fresh OB" };
  return { score: ob.confidence / 100, detail: `${ob.kind} (${ob.confidence}%)` };
}

function scoreFvg(s: IctSnapshot, dir: Direction) {
  const fvg = s.fvgs
    .filter((f) => f.direction === dir && !f.mitigated)
    .sort((a, b) => b.score - a.score)[0];
  if (!fvg) return { score: 0, detail: "no fresh FVG" };
  return { score: fvg.score / 100, detail: `${fvg.kind} (${fvg.score})` };
}

function scoreVolume(s: IctSnapshot, dir: Direction) {
  const v = s.volume;
  if (!v) return { score: 0, detail: "n/a" };
  const deltaAligned = dir === "bullish" ? v.delta > 0 : v.delta < 0;
  let score = Math.min(1, v.relative / 2);
  if (deltaAligned) score = Math.min(1, score + 0.3);
  return { score, detail: `${v.relative.toFixed(2)}× vol, delta ${(v.delta * 100).toFixed(0)}%` };
}

function scoreSession(inKillzone: boolean, sessionBias: Bias, dir: Direction) {
  let score = inKillzone ? 0.6 : 0.2;
  if (sessionBias === dir) score = Math.min(1, score + 0.4);
  return { score, detail: `${inKillzone ? "killzone" : "off-KZ"}, session ${sessionBias}` };
}

function scoreTrend(candles: Candle[], dir: Direction, htf: Bias) {
  const e = ema(candles, 50);
  const now = e.at(-1) ?? 0;
  const prev = e.at(-6) ?? now;
  const price = candles.at(-1)?.close ?? 0;
  const emaAligned = dir === "bullish" ? price > now && now >= prev : price < now && now <= prev;
  const htfAligned = htf === dir;
  const score = (emaAligned ? 0.5 : 0) + (htfAligned ? 0.5 : 0);
  return { score, detail: `EMA ${emaAligned ? "✓" : "✗"}, HTF ${htf}` };
}
