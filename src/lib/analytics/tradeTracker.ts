import type { Candle, PaperTrade, Signal } from "@/types";
import { uid } from "@/lib/utils";

/**
 * Paper-trade tracker. Converts a strategy `Signal` into a tracked position
 * and settles it against subsequent candles. This is pure bookkeeping around
 * the strategy output — it does not influence signal generation.
 *
 * Settlement model (deterministic and conservative):
 *  - The primary target is TP2 (the signal's main draw-on-liquidity target).
 *  - If a candle's range touches both SL and TP in the same bar, SL is assumed
 *    first (worst case), so results are never optimistic.
 *  - Win  = +riskReward R, Loss = -1 R.
 */
export function tradeFromSignal(signal: Signal): PaperTrade {
  return {
    id: uid(),
    signalId: signal.id,
    symbol: signal.symbol,
    market: signal.market,
    timeframe: signal.timeframe,
    side: signal.side,
    entry: signal.entry,
    stopLoss: signal.stopLoss,
    takeProfit: signal.takeProfit2,
    riskReward: signal.riskReward,
    confidence: signal.confidence,
    openedAt: signal.createdAt,
    status: "open",
  };
}

/**
 * Attempt to settle an open trade against candles that occurred after it was
 * opened. Returns the (possibly closed) trade — unchanged if still open.
 */
export function settleTrade(trade: PaperTrade, candles: Candle[]): PaperTrade {
  if (trade.status !== "open") return trade;
  const long = trade.side === "BUY";

  for (const c of candles) {
    if (c.time <= trade.openedAt) continue;

    const hitStop = long ? c.low <= trade.stopLoss : c.high >= trade.stopLoss;
    const hitTarget = long ? c.high >= trade.takeProfit : c.low <= trade.takeProfit;

    if (hitStop) {
      return {
        ...trade,
        status: "loss",
        closedAt: c.time,
        exitPrice: trade.stopLoss,
        rMultiple: -1,
        reason: "SL",
      };
    }
    if (hitTarget) {
      return {
        ...trade,
        status: "win",
        closedAt: c.time,
        exitPrice: trade.takeProfit,
        rMultiple: trade.riskReward,
        reason: "TP",
      };
    }
  }
  return trade;
}

/** Settle a batch of trades against candles for one symbol+timeframe. */
export function settleTrades(
  trades: PaperTrade[],
  candles: Candle[],
  symbol: string,
  timeframe: string,
): PaperTrade[] {
  return trades.map((t) =>
    t.status === "open" && t.symbol === symbol && t.timeframe === timeframe
      ? settleTrade(t, candles)
      : t,
  );
}
