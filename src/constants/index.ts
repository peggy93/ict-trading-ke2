import type { Timeframe } from "@/types";

/**
 * Static domain constants (values that describe the market, not tunable
 * behaviour). Tunable engine parameters live in `@/config`.
 */

/** All timeframes analyzed simultaneously (lowest → highest). */
export const TIMEFRAMES: Timeframe[] = [
  "1m", "3m", "5m", "15m", "30m", "1h", "4h", "1d", "1w",
];

/** Timeframes shown as selectable chart intervals in the UI. */
export const CHART_TIMEFRAMES: Timeframe[] = [
  "1m", "5m", "15m", "1h", "4h", "1d",
];

/** Higher-timeframe order used for bias cascade (highest first). */
export const HTF_ORDER: Timeframe[] = [
  "1w", "1d", "4h", "1h", "30m", "15m", "5m", "3m", "1m",
];

export const TF_MS: Record<Timeframe, number> = {
  "1m": 60_000,
  "3m": 180_000,
  "5m": 300_000,
  "15m": 900_000,
  "30m": 1_800_000,
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1d": 86_400_000,
  "1w": 604_800_000,
};

/** Weight of each timeframe in the higher-timeframe bias cascade. */
export const TF_WEIGHT: Record<Timeframe, number> = {
  "1w": 6,
  "1d": 5,
  "4h": 4,
  "1h": 3,
  "30m": 2.5,
  "15m": 2,
  "5m": 1,
  "3m": 0.75,
  "1m": 0.5,
};

/** Ring-buffer cap per timeframe (bounds memory). */
export const MAX_CANDLES = 1500;

/** Bars needed before a timeframe produces meaningful analysis. */
export const MIN_CANDLES_FOR_ANALYSIS = 20;
export const MIN_CANDLES_FOR_SIGNAL = 50;

/**
 * Trading sessions in UTC hours (ICT convention).
 * killzones are the high-probability windows inside each session.
 */
export const SESSIONS = {
  Asia:    { openUtc: 0,  closeUtc: 9,  kzStartUtc: 0,  kzEndUtc: 4  },
  London:  { openUtc: 7,  closeUtc: 16, kzStartUtc: 7,  kzEndUtc: 10 },
  NewYork: { openUtc: 12, closeUtc: 21, kzStartUtc: 12, kzEndUtc: 15 },
} as const;

/** Named ICT killzones (UTC hours). */
export const KILLZONES = {
  AsianKillzone: { startUtc: 0,  endUtc: 4  },
  LondonOpen:    { startUtc: 7,  endUtc: 10 },
  NewYorkOpen:   { startUtc: 12, endUtc: 15 },
  LondonClose:   { startUtc: 15, endUtc: 16 },
} as const;

/** Fibonacci ratios for retracement and expansion projections. */
export const FIB_RETRACEMENT = [0.236, 0.382, 0.5, 0.618, 0.705, 0.79];
export const FIB_EXPANSION = [1.0, 1.272, 1.618, 2.0, 2.618];

/** OTE (Optimal Trade Entry) band. */
export const OTE_BAND = { start: 0.62, end: 0.79 };
