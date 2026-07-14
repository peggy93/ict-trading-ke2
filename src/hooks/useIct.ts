"use client";
import { useMemo } from "react";
import { useMarketStore } from "@/store/useMarketStore";
import { htfBias, runIct } from "@/engine/ictEngine";
import { TIMEFRAMES } from "@/config/constants";
import type { IctSnapshot, Timeframe } from "@/types";

/**
 * Compute ICT snapshots for every loaded timeframe + the aggregate HTF bias.
 * Memoized by the per-timeframe candle counts so it only recomputes when a bar
 * closes or a new bar appears — not on every in-progress price tick.
 */
export function useIct(activeTf: Timeframe) {
  const candles = useMarketStore((s) => s.candles);
  const lengthKey = TIMEFRAMES.map((tf) => `${tf}:${candles[tf]?.length ?? 0}`).join("|");

  return useMemo(() => {
    const snapshots: Partial<Record<Timeframe, IctSnapshot>> = {};
    for (const tf of TIMEFRAMES) {
      const arr = candles[tf];
      if (arr && arr.length) snapshots[tf] = runIct(tf, arr);
    }
    const bias = htfBias(snapshots);
    return { snapshots, active: snapshots[activeTf], htf: bias };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lengthKey, activeTf]);
}
