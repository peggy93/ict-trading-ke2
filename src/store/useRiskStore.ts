import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Risk-management configuration. These settings drive position sizing and the
 * paper-trading guardrails; they never alter the detection strategy itself.
 */
export interface RiskConfig {
  accountEquity: number;
  /** "percent" = risk % of equity per trade; "fixed" = fixed lot size. */
  sizingMode: "percent" | "fixed";
  riskPercent: number;
  fixedLotSize: number;
  maxDailyLossPct: number;
  maxDrawdownPct: number;
  maxOpenPositions: number;
  /** Stop generating/taking trades once cumulative profit (R) hits this. */
  profitTargetR: number;
  autoBreakEven: boolean;
  /** Move SL to break-even once price reaches this R multiple. */
  breakEvenAtR: number;
  trailingStop: boolean;
  trailingAtrMult: number;
  partialTakeProfit: boolean;
  /** % of position closed at TP1 when partial TP is enabled. */
  partialTp1Pct: number;
}

export const DEFAULT_RISK: RiskConfig = {
  accountEquity: 10_000,
  sizingMode: "percent",
  riskPercent: 1,
  fixedLotSize: 0.01,
  maxDailyLossPct: 5,
  maxDrawdownPct: 15,
  maxOpenPositions: 3,
  profitTargetR: 6,
  autoBreakEven: true,
  breakEvenAtR: 1,
  trailingStop: false,
  trailingAtrMult: 1.5,
  partialTakeProfit: true,
  partialTp1Pct: 50,
};

interface RiskState extends RiskConfig {
  set: (patch: Partial<RiskConfig>) => void;
  reset: () => void;
}

export const useRiskStore = create<RiskState>()(
  persist(
    (set) => ({
      ...DEFAULT_RISK,
      set: (patch) => set(patch),
      reset: () => set(DEFAULT_RISK),
    }),
    { name: "ict-risk" },
  ),
);
