"use client";
import { useQueries } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchKlines } from "@/services/bingx/rest";
import { useMarketStore } from "@/store/useMarketStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { TIMEFRAMES } from "@/config/constants";
import type { MarketType } from "@/types";

/**
 * REST-bootstraps historical candles for every analyzed timeframe using a
 * single `useQueries` call (correct, stable Rules-of-Hooks usage — no hooks in
 * a loop). React Query caches per (market, symbol, tf); the WebSocket hook
 * then keeps the active timeframe's tail fresh.
 */
export function useMultiTimeframeCandles(market: MarketType, symbol: string) {
  const setCandles = useMarketStore((s) => s.setCandles);
  const setRestOk = useMarketStore((s) => s.setRestOk);
  const { apiKey, apiSecret } = useSettingsStore();

  const results = useQueries({
    queries: TIMEFRAMES.map((tf) => ({
      queryKey: ["klines", market, symbol, tf],
      queryFn: () => fetchKlines(market, symbol, tf, 500, { key: apiKey, secret: apiSecret }),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      retry: 2,
    })),
  });

  const stamp = results.map((q) => q.dataUpdatedAt).join(",");
  const anyError = results.every((q) => q.isError);

  useEffect(() => {
    results.forEach((q, i) => {
      const tf = TIMEFRAMES[i]!;
      if (q.data) setCandles(tf, q.data);
    });
    if (results.some((q) => q.data)) setRestOk(true);
    else if (anyError) setRestOk(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stamp]);

  return results;
}
