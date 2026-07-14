import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarketType, Timeframe } from "@/types";
import type { AlertPrefs } from "@/services/alerts/alertService";
import { THRESHOLDS } from "@/config";

interface SettingsState {
  symbol: string;
  market: MarketType;
  timeframe: Timeframe;
  minConfidence: number;
  minConfirmations: number;
  apiKey: string;      // read-only key; kept client-side, sent per-request as header
  apiSecret: string;   // in-memory only, never persisted
  alerts: AlertPrefs;
  set: (patch: Partial<SettingsState>) => void;
  setAlerts: (patch: Partial<AlertPrefs>) => void;
}

/**
 * Persisted UI/preferences. The secret is intentionally excluded from
 * persistence — it lives only in memory for the session. Prefer READ-ONLY keys.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      symbol: "BTC-USDT",
      market: "perp",
      timeframe: "15m",
      minConfidence: THRESHOLDS.defaultMinConfidence,
      minConfirmations: 4,
      apiKey: "",
      apiSecret: "",
      alerts: { browser: true, sound: true, telegram: false, discord: false },
      set: (patch) => set(patch),
      setAlerts: (patch) => set((s) => ({ alerts: { ...s.alerts, ...patch } })),
    }),
    {
      name: "ict-settings",
      // never persist the secret
      partialize: (s) => ({
        symbol: s.symbol,
        market: s.market,
        timeframe: s.timeframe,
        minConfidence: s.minConfidence,
        minConfirmations: s.minConfirmations,
        apiKey: s.apiKey,
        alerts: s.alerts,
      }),
    },
  ),
);
