import type {
  BacktestParams, BacktestResult, Candle, MarketType, PaperTrade, Timeframe,
} from "@/types";
import { runIct } from "@/lib/engine/ictEngine";
import { generateSignal } from "@/lib/engine/signals/signalEngine";
import { killzoneStatus, sessionBias } from "@/lib/engine/sessions";
import { computeReport } from "@/lib/analytics/metrics";
import { settleTrade, tradeFromSignal } from "@/lib/analytics/tradeTracker";

export interface BacktestMeta {
  symbol: string;
  market: MarketType;
  timeframe: Timeframe;
}

export const DEFAULT_BACKTEST_PARAMS: BacktestParams = {
  minConfidence: 65,
  minConfirmations: 4,
  warmup: 60,
};

/**
 * Walk-forward backtest that reuses the EXACT production engine
 * (`runIct` + `generateSignal`) on an expanding candle window — no strategy
 * logic is duplicated or altered here. One position at a time is modelled;
 * each signal is settled against subsequent candles by the shared tracker.
 *
 * Note: multi-timeframe HTF bias is approximated by the tested timeframe's own
 * bias (a single kline series is provided), and kill-zone / session context is
 * derived from each candle's timestamp. Results are indicative, not a promise
 * of live performance.
 */
export function runBacktest(
  candles: Candle[],
  meta: BacktestMeta,
  params: BacktestParams = DEFAULT_BACKTEST_PARAMS,
): BacktestResult {
  const trades: PaperTrade[] = [];
  let open: PaperTrade | null = null;

  const start = Math.max(params.warmup, 20);

  for (let i = start; i < candles.length; i++) {
    const bar = candles[i]!;

    // 1) Settle the live position against the just-closed bar.
    if (open) {
      const settled = settleTrade(open, [bar]);
      if (settled.status !== "open") {
        trades.push(settled);
        open = null;
      }
    }

    // 2) Only look for a new setup when flat.
    if (open) continue;

    const window = candles.slice(0, i + 1);
    const snapshot = runIct(meta.timeframe, window);
    if (!snapshot.structure.length) continue;

    const signal = generateSignal({
      symbol: meta.symbol,
      market: meta.market,
      timeframe: meta.timeframe,
      candles: window,
      snapshot,
      htf: snapshot.bias, // single-series approximation of HTF bias
      inKillzone: killzoneStatus(bar.time).some((k) => k.active),
      sessionBias: sessionBias(window, bar.time),
      minConfidence: params.minConfidence,
      minConfirmations: params.minConfirmations,
    });

    if (signal) {
      open = { ...tradeFromSignal(signal), openedAt: bar.time };
    }
  }

  // Any still-open position is reported as open (unsettled).
  if (open) trades.push(open);

  return {
    symbol: meta.symbol,
    market: meta.market,
    timeframe: meta.timeframe,
    params,
    fromTime: candles[start]?.time ?? 0,
    toTime: candles.at(-1)?.time ?? 0,
    candlesTested: Math.max(0, candles.length - start),
    trades,
    report: computeReport(trades),
  };
}
