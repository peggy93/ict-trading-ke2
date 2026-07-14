import type { Candle, FVG } from "@/types";
import { atr } from "@/lib/engine/indicators";
import { THRESHOLDS } from "@/config";
import { mean, midpoint, normalize } from "@/utils";

/**
 * Fair Value Gap engine. Detects bullish/bearish imbalances (3-candle gaps),
 * computes Consequent Encroachment (CE = 50% of the gap), flags inversions
 * (a gap that has been violated and now acts from the opposite side), and
 * derives Balanced Price Ranges (BPR = overlap of opposing FVGs).
 *
 * Every gap is scored 0..100 on size (gap/ATR) and volume of the impulse
 * candle. Market-context / timeframe-alignment weighting is layered on by the
 * orchestrator/signal engine.
 */
export function detectFVGs(candles: Candle[]): FVG[] {
  const atrArr = atr(candles, THRESHOLDS.atrPeriod);
  const avgVol = mean(candles.map((c) => c.volume)) || 1;
  const gaps: FVG[] = [];

  for (let i = 2; i < candles.length; i++) {
    const a = candles[i - 2]!;
    const c = candles[i]!;
    const aAtr = atrArr[i] || 1e-9;

    // Bullish imbalance: candle-3 low above candle-1 high.
    if (c.low > a.high) {
      gaps.push(mkGap("bullish", c.low, a.high, c, i, aAtr, avgVol, candles));
    }
    // Bearish imbalance: candle-3 high below candle-1 low.
    if (c.high < a.low) {
      gaps.push(mkGap("bearish", a.low, c.high, c, i, aAtr, avgVol, candles));
    }
  }

  markInversions(gaps, candles);
  return [...gaps, ...detectBPR(gaps)];
}

function mkGap(
  direction: "bullish" | "bearish",
  top: number,
  bottom: number,
  impulse: Candle,
  index: number,
  aAtr: number,
  avgVol: number,
  candles: Candle[],
): FVG {
  const size = top - bottom;
  const sizeScore = normalize(size / aAtr, 2);      // 2×ATR gap = full marks
  const volScore = normalize(impulse.volume / avgVol, 2);
  const score = Math.round((0.6 * sizeScore + 0.4 * volScore) * 100);

  const mitigated = candles.slice(index + 1).some((x) =>
    direction === "bullish" ? x.low <= bottom : x.high >= top,
  );

  return {
    kind: "FVG",
    direction,
    top,
    bottom,
    ce: midpoint(top, bottom),
    time: impulse.time,
    index,
    mitigated,
    score,
  };
}

/** A gap that price has fully traded through inverts its polarity. */
function markInversions(gaps: FVG[], candles: Candle[]): void {
  for (const g of gaps) {
    const violated = candles.slice(g.index + 1).some((x) =>
      g.direction === "bullish" ? x.close < g.bottom : x.close > g.top,
    );
    if (violated) {
      g.kind = "inversion";
      g.direction = g.direction === "bullish" ? "bearish" : "bullish";
    }
  }
}

/** Balanced Price Range: overlap of a bullish and a bearish FVG. */
function detectBPR(gaps: FVG[]): FVG[] {
  const out: FVG[] = [];
  const bulls = gaps.filter((g) => g.direction === "bullish" && g.kind === "FVG");
  const bears = gaps.filter((g) => g.direction === "bearish" && g.kind === "FVG");

  for (const b of bulls) {
    for (const s of bears) {
      const top = Math.min(b.top, s.top);
      const bottom = Math.max(b.bottom, s.bottom);
      if (top > bottom) {
        const recent = b.index > s.index ? b : s;
        out.push({
          kind: "BPR",
          direction: recent.direction,
          top,
          bottom,
          ce: midpoint(top, bottom),
          time: recent.time,
          index: recent.index,
          mitigated: b.mitigated && s.mitigated,
          score: Math.round((b.score + s.score) / 2),
        });
      }
    }
  }
  return out;
}
