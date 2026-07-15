import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardView = "live" | "analytics" | "risk" | "alerts" | "backtest" | "settings";

/** Which ICT overlays/panels are visible (customization requirement). */
export interface IndicatorToggles {
  structure: boolean;
  liquidity: boolean;
  fvg: boolean;
  orderBlocks: boolean;
  premiumDiscount: boolean;
  sessions: boolean;
  volume: boolean;
  mtf: boolean;
  orderBook: boolean;
  watchlist: boolean;
}

export const DEFAULT_INDICATORS: IndicatorToggles = {
  structure: true,
  liquidity: true,
  fvg: true,
  orderBlocks: true,
  premiumDiscount: true,
  sessions: true,
  volume: true,
  mtf: true,
  orderBook: true,
  watchlist: true,
};

interface UiState {
  view: DashboardView;
  indicators: IndicatorToggles;
  sidebarOpen: boolean;
  setView: (v: DashboardView) => void;
  toggleIndicator: (key: keyof IndicatorToggles) => void;
  setIndicators: (patch: Partial<IndicatorToggles>) => void;
  setSidebar: (open: boolean) => void;
}

/** Persisted UI state: active view, indicator visibility, layout. */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      view: "live",
      indicators: DEFAULT_INDICATORS,
      sidebarOpen: false,
      setView: (view) => set({ view }),
      toggleIndicator: (key) =>
        set((s) => ({ indicators: { ...s.indicators, [key]: !s.indicators[key] } })),
      setIndicators: (patch) => set((s) => ({ indicators: { ...s.indicators, ...patch } })),
      setSidebar: (sidebarOpen) => set({ sidebarOpen }),
    }),
    { name: "ict-ui" },
  ),
);
