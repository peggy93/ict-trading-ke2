import type { Candle, DisplacementCandle } from "@/types";
import { atr } from "@/lib/engine/indicators";
import { THRESHOLDS } from "@/config";
import { body, range } from "@/utils";

/**
 * Displacement candle: an abnormally large-bodied candle (body > k×ATR)
 * signalling institutional intent. The `institutional` flag marks the
 * strongest ones (body > institutionalAtr×ATR AND a dominant body / small
 * opposing wick) — the classic ICT order-flow candle that creates FVGs.
 */
export function detectDisplacement(candles: Candle[], k: number = THRESHOLDS.displacementAtr): DisplacementCandle[] {
  const a = atr(candles, THRESHOLDS.atrPeriod);
  const out: DisplacementCandle[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    const b = body(c);
    const bodyAtr = b / (a[i] || 1e-9);
    if (bodyAtr < k) continue;

    const direction = c.close >= c.open ? "bullish" : "bearish";
    const bodyDominance = b / range(c);
    out.push({
      index: i,
      time: c.time,
      direction,
      bodyAtr: +bodyAtr.toFixed(2),
      institutional:
        bodyAtr >= THRESHOLDS.institutionalAtr && bodyDominance >= THRESHOLDS.bodyDominance,
    });
  }

  return out;
}
