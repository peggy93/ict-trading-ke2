import type {
  Bias, Candle, Direction, StructuralPoint, StructureEvent, StructureScope, Swing,
} from "@/types";
import { atr, findSwings } from "@/lib/engine/indicators";
import { THRESHOLDS } from "@/config";
import { body } from "@/utils";

export interface StructureResult {
  swings: Swing[];            // external (major) swings
  internalSwings: Swing[];
  structure: StructureEvent[]; // external + internal, time-ordered
  structuralPoints: StructuralPoint[];
  bias: Bias;
}

/**
 * Institutional market-structure engine.
 *
 * Noise filtering: a level is only "broken" when a candle *closes* through it
 * (wicks are ignored), and the breaking candle's displacement (body/ATR) is
 * recorded so downstream logic can distinguish decisive shifts (MSS) from
 * ordinary continuation (BOS).
 *
 *  - BOS  : continuation break in the direction of the prevailing trend.
 *  - CHoCH: first counter-trend break — earliest reversal warning.
 *  - MSS  : a CHoCH accompanied by real displacement (institutional intent).
 */
export function analyzeStructure(
  candles: Candle[],
  swingLookback: number = THRESHOLDS.swingLookback,
  internalLookback: number = THRESHOLDS.internalLookback,
): StructureResult {
  const atrArr = atr(candles, THRESHOLDS.atrPeriod);

  const external = findSwings(candles, swingLookback);
  const internal = findSwings(candles, internalLookback);

  const extEvents = detectBreaks(candles, external.all, atrArr, swingLookback, "external");
  const intEvents = detectBreaks(candles, internal.all, atrArr, internalLookback, "internal");

  const structure = [...extEvents.events, ...intEvents.events].sort((a, b) => a.time - b.time);
  const bias: Bias = extEvents.trend ?? "neutral";

  const structuralPoints = classifyPoints(candles, external.all, bias);

  return {
    swings: external.all,
    internalSwings: internal.all,
    structure,
    structuralPoints,
    bias,
  };
}

function detectBreaks(
  candles: Candle[],
  swings: Swing[],
  atrArr: number[],
  lookback: number,
  scope: StructureScope,
): { events: StructureEvent[]; trend: Direction | null } {
  const events: StructureEvent[] = [];

  // Swing becomes "known" only after `lookback` confirming bars.
  const bySwingConfirm = swings
    .map((s) => ({ swing: s, confirmAt: s.index + lookback }))
    .sort((a, b) => a.confirmAt - b.confirmAt);

  let ptr = 0;
  let trend: Direction | null = null;
  let activeHigh: Swing | null = null;
  let activeLow: Swing | null = null;

  for (let i = 0; i < candles.length; i++) {
    // Register swings that have just become confirmed by bar i.
    while (ptr < bySwingConfirm.length && bySwingConfirm[ptr]!.confirmAt <= i) {
      const s = bySwingConfirm[ptr]!.swing;
      if (s.kind === "high") activeHigh = s;
      else activeLow = s;
      ptr++;
    }

    const c = candles[i]!;
    const disp = body(c) / (atrArr[i] || 1e-9);

    // Bullish break: close above the active swing high.
    if (activeHigh && c.close > activeHigh.price) {
      const reversal = trend === "bearish";
      const type = reversal
        ? disp >= THRESHOLDS.displacementAtr ? "MSS" : "CHoCH"
        : "BOS";
      events.push({
        type, scope, direction: "bullish", time: c.time,
        price: activeHigh.price, brokenSwing: activeHigh, displacement: disp,
      });
      trend = "bullish";
      activeHigh = null; // wait for a fresh swing high
    }

    // Bearish break: close below the active swing low.
    if (activeLow && c.close < activeLow.price) {
      const reversal = trend === "bullish";
      const type = reversal
        ? disp >= THRESHOLDS.displacementAtr ? "MSS" : "CHoCH"
        : "BOS";
      events.push({
        type, scope, direction: "bearish", time: c.time,
        price: activeLow.price, brokenSwing: activeLow, displacement: disp,
      });
      trend = "bearish";
      activeLow = null;
    }
  }

  return { events, trend };
}

/**
 * Classify each swing as strong/weak and flag the protected point.
 *  - weak:   the swing was later taken (closed through) → liquidity.
 *  - strong: the swing has NOT been taken → likely institutional origin.
 *  - protected: the most recent strong low (bullish bias) / strong high
 *               (bearish bias) that currently defends the trend.
 */
function classifyPoints(candles: Candle[], swings: Swing[], bias: Bias): StructuralPoint[] {
  const points: StructuralPoint[] = swings.map((sw) => {
    const taken = candles.slice(sw.index + 1).some((c) =>
      sw.kind === "high" ? c.close > sw.price : c.close < sw.price,
    );
    return { swing: sw, quality: taken ? "weak" : "strong", protectedPoint: false };
  });

  if (bias === "bullish") {
    const p = [...points].reverse().find((pt) => pt.swing.kind === "low" && pt.quality === "strong");
    if (p) p.protectedPoint = true;
  } else if (bias === "bearish") {
    const p = [...points].reverse().find((pt) => pt.swing.kind === "high" && pt.quality === "strong");
    if (p) p.protectedPoint = true;
  }

  return points;
}
