"use client";
import { useEffect, useRef } from "react";
import { useMarketStore } from "@/store/useMarketStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useWatchlistStore } from "@/store/useWatchlistStore";
import { generateSignal } from "@/engine/signals/signalEngine";
import { killzoneStatus, sessionBias } from "@/engine/sessions";
import { fireAlerts } from "@/services/alerts/alertService";
import { MIN_CANDLES_FOR_SIGNAL } from "@/config/constants";
import type { Bias, IctSnapshot, Timeframe } from "@/types";

interface Args {
  timeframe: Timeframe;
  snapshot?: IctSnapshot;
  htf: Bias;
}

/**
 * Evaluate the signal engine whenever the active snapshot changes. Dedupes by
 * (side + rounded entry) so the same setup isn't emitted repeatedly, fans out
 * alerts, and mirrors the latest signal into the watchlist.
 */
export function useSignals({ timeframe, snapshot, htf }: Args): void {
  const { symbol, market, minConfidence, minConfirmations, alerts } = useSettingsStore();
  const addSignal = useMarketStore((s) => s.addSignal);
  const candles = useMarketStore((s) => s.candles[timeframe]);
  const setSignal = useWatchlistStore((s) => s.setSignal);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    if (!snapshot || !candles || candles.length < MIN_CANDLES_FOR_SIGNAL) return;

    const inKillzone = killzoneStatus().some((k) => k.active);
    const sBias = sessionBias(candles);

    const signal = generateSignal({
      symbol, market, timeframe, candles, snapshot, htf,
      inKillzone, sessionBias: sBias, minConfidence, minConfirmations,
    });
    if (!signal) return;

    const key = `${signal.side}:${signal.entry.toFixed(2)}`;
    if (key === lastKeyRef.current) return; // dedupe repeats
    lastKeyRef.current = key;

    addSignal(signal);
    setSignal(symbol, signal);
    void fireAlerts(signal, alerts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);
}
