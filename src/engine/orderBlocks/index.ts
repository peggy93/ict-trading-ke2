import type {
  Candle, Direction, FVG, LiquiditySweep, OrderBlock, StructureEvent,
} from "@/types";
import { atr } from "@/engine/indicators";
import { THRESHOLDS } from "@/config/constants";
import { body, lowerWick, mean, normalize, upperWick } from "@/utils";

export interface OrderBlockContext {
  fvgs?: FVG[];
  sweeps?: LiquiditySweep[];
  structure?: StructureEvent[];
}

/**
 * Order Block engine. Detects the last opposing candle before a displacement
 * move and ranks it 0..100 by displacement, volume, liquidity-sweep
 * confluence, FVG confluence and market-structure confirmation.
 *
 * Kinds: orderBlock · breaker · mitigation · rejection · institutional.
 */
export function detectOrderBlocks(
  candles: Candle[],
  ctx: OrderBlockContext = {},
): OrderBlock[] {
  const atrArr = atr(candles, THRESHOLDS.atrPeriod);
  const avgVol = mean(candles.map((c) => c.volume)) || 1;
  const out: OrderBlock[] = [];

  for (let i = 1; i < candles.length - 1; i++) {
    const cur = candles[i]!;
    const next = candles[i + 1]!;
    const a = atrArr[i] || 1e-9;
    const move = Math.abs(next.close - cur.close);
    const dispAtr = move / a;
    if (dispAtr < THRESHOLDS.displacementAtr) continue;

    let direction: Direction | null = null;
    if (next.close > cur.close && cur.close < cur.open) direction = "bullish"; // down candle → up move
    else if (next.close < cur.close && cur.close > cur.open) direction = "bearish"; // up candle → down move
    if (!direction) continue;

    out.push(buildBlock(direction, cur, i, dispAtr, avgVol, candles, ctx));
  }

  return out;
}

function buildBlock(
  direction: Direction,
  c: Candle,
  i: number,
  dispAtr: number,
  avgVol: number,
  candles: Candle[],
  ctx: OrderBlockContext,
): OrderBlock {
  const top = Math.max(c.open, c.close, c.high);
  const bottom = Math.min(c.open, c.close, c.low);
  const after = candles.slice(i + 2);
  const last = candles.at(-1)!;

  const mitigated = direction === "bullish"
    ? after.some((x) => x.low <= top && x.low >= bottom)
    : after.some((x) => x.high >= bottom && x.high <= top);

  const brokenThrough = direction === "bullish" ? last.close < bottom : last.close > top;

  // Rejection candle: large opposing wick relative to the body.
  const wick = direction === "bullish" ? lowerWick(c) : upperWick(c);
  const rejection = wick > body(c) * 1.2;

  // --- Confidence factors ------------------------------------------------
  const factors: string[] = [];
  let score = 0;

  const dScore = normalize(dispAtr, 2.5);
  score += dScore * 30;
  factors.push(`displacement ${dispAtr.toFixed(2)}×ATR`);

  const vScore = normalize(c.volume / avgVol, 2);
  if (vScore > 0.4) factors.push(`volume ${(c.volume / avgVol).toFixed(2)}×`);
  score += vScore * 20;

  const sweep = ctx.sweeps?.find((s) => s.direction === direction && Math.abs(s.index - i) <= 3);
  if (sweep) { score += 20; factors.push(`${sweep.kind} confluence`); }

  const fvg = ctx.fvgs?.find((f) => f.direction === direction && f.index >= i && f.index <= i + 3);
  if (fvg) { score += 15; factors.push("FVG confluence"); }

  const struct = ctx.structure?.find((e) => e.direction === direction && e.time >= c.time);
  if (struct) { score += 15; factors.push(`${struct.type} confirmation`); }

  const confidence = Math.round(Math.min(100, score));

  // --- Kind classification (highest precedence first) --------------------
  let kind: OrderBlock["kind"] = "orderBlock";
  if (dispAtr >= THRESHOLDS.institutionalAtr && confidence >= 60) kind = "institutional";
  else if (brokenThrough) kind = "breaker";
  else if (rejection) kind = "rejection";
  else if (mitigated) kind = "mitigation";

  return {
    kind, direction, top, bottom, time: c.time, index: i,
    mitigated, confidence, factors,
  };
}
