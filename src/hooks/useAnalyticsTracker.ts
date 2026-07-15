"use client";
import { useEffect } from "react";
import { useMarketStore } from "@/store/useMarketStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";

/**
 * Bridges live strategy output into the paper-trading ledger: every generated
 * signal becomes a tracked trade, and open trades are settled against the
 * streaming candles of the active symbol/timeframe.
 */
export function useAnalyticsTracker(): void {
  const signals = useMarketStore((s) => s.signals);
  const { symbol, timeframe } = useSettingsStore();
  const candles = useMarketStore((s) => s.candles[timeframe]);
  const trackSignal = useAnalyticsStore((s) => s.trackSignal);
  const settle = useAnalyticsStore((s) => s.settle);

  // Record any new signals (store dedupes by signalId).
  useEffect(() => {
    signals.forEach(trackSignal);
  }, [signals, trackSignal]);

  // Settle open trades whenever candles advance.
  useEffect(() => {
    if (candles && candles.length) settle(candles, symbol, timeframe);
  }, [candles, symbol, timeframe, settle]);
}
