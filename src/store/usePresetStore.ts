import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarketType, Timeframe } from "@/types";
import type { AlertPrefs } from "@/services/alerts/alertService";
import { useSettingsStore } from "./useSettingsStore";
import { useUiStore, type IndicatorToggles } from "./useUiStore";
import { useRiskStore, type RiskConfig } from "./useRiskStore";

interface PresetData {
  symbol: string;
  market: MarketType;
  timeframe: Timeframe;
  minConfidence: number;
  minConfirmations: number;
  alerts: AlertPrefs;
  indicators: IndicatorToggles;
  risk: RiskConfig;
}

export interface Preset {
  name: string;
  createdAt: number;
  data: PresetData;
}

interface PresetState {
  presets: Preset[];
  save: (name: string) => void;
  apply: (name: string) => void;
  remove: (name: string) => void;
}

function snapshot(): PresetData {
  const s = useSettingsStore.getState();
  const ui = useUiStore.getState();
  const r = useRiskStore.getState();
  const risk: RiskConfig = {
    accountEquity: r.accountEquity,
    sizingMode: r.sizingMode,
    riskPercent: r.riskPercent,
    fixedLotSize: r.fixedLotSize,
    maxDailyLossPct: r.maxDailyLossPct,
    maxDrawdownPct: r.maxDrawdownPct,
    maxOpenPositions: r.maxOpenPositions,
    profitTargetR: r.profitTargetR,
    autoBreakEven: r.autoBreakEven,
    breakEvenAtR: r.breakEvenAtR,
    trailingStop: r.trailingStop,
    trailingAtrMult: r.trailingAtrMult,
    partialTakeProfit: r.partialTakeProfit,
    partialTp1Pct: r.partialTp1Pct,
  };
  return {
    symbol: s.symbol,
    market: s.market,
    timeframe: s.timeframe,
    minConfidence: s.minConfidence,
    minConfirmations: s.minConfirmations,
    alerts: s.alerts,
    indicators: ui.indicators,
    risk,
  };
}

/**
 * Named strategy/dashboard presets. Snapshots the relevant settings, indicator
 * visibility and risk config so users can switch complete configurations.
 */
export const usePresetStore = create<PresetState>()(
  persist(
    (set, get) => ({
      presets: [],
      save: (name) => {
        const preset: Preset = { name, createdAt: Date.now(), data: snapshot() };
        set((st) => ({
          presets: [...st.presets.filter((p) => p.name !== name), preset].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        }));
      },
      apply: (name) => {
        const preset = get().presets.find((p) => p.name === name);
        if (!preset) return;
        const d = preset.data;
        useSettingsStore.getState().set({
          symbol: d.symbol,
          market: d.market,
          timeframe: d.timeframe,
          minConfidence: d.minConfidence,
          minConfirmations: d.minConfirmations,
          alerts: d.alerts,
        });
        useUiStore.getState().setIndicators(d.indicators);
        useRiskStore.getState().set(d.risk);
      },
      remove: (name) => set((st) => ({ presets: st.presets.filter((p) => p.name !== name) })),
    }),
    { name: "ict-presets" },
  ),
);
