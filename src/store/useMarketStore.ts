import { create } from "zustand";
import type { Candle, OrderBook, PerformanceMetrics, Signal, Timeframe, Trade } from "@/types";
import type { WsStatus } from "@/services/bingx/wsManager";
import { MAX_CANDLES } from "@/config/constants";

interface MarketState {
  candles: Partial<Record<Timeframe, Candle[]>>;
  orderBook: OrderBook | null;
  trades: Trade[];
  lastPrice: number;
  signals: Signal[];
  wsStatus: WsStatus;
  restOk: boolean;

  setCandles: (tf: Timeframe, candles: Candle[]) => void;
  upsertCandle: (tf: Timeframe, candle: Candle) => void;
  setOrderBook: (ob: OrderBook) => void;
  pushTrade: (t: Trade) => void;
  addSignal: (s: Signal) => void;
  setWsStatus: (s: WsStatus) => void;
  setRestOk: (ok: boolean) => void;
  reset: () => void;
  metrics: () => PerformanceMetrics;
}

/**
 * Central market store. Uses a per-timeframe ring buffer capped at
 * MAX_CANDLES to bound memory. Granular setters keep updates targeted so
 * components subscribing to a single slice don't re-render on every tick.
 */
export const useMarketStore = create<MarketState>((set, get) => ({
  candles: {},
  orderBook: null,
  trades: [],
  lastPrice: 0,
  signals: [],
  wsStatus: "closed",
  restOk: false,

  setCandles: (tf, candles) =>
    set((st) => ({ candles: { ...st.candles, [tf]: candles.slice(-MAX_CANDLES) } })),

  upsertCandle: (tf, candle) =>
    set((st) => {
      const arr = st.candles[tf] ? [...st.candles[tf]!] : [];
      const last = arr[arr.length - 1];
      if (last && last.time === candle.time) arr[arr.length - 1] = candle; // update forming bar
      else arr.push(candle);                                              // new bar
      if (arr.length > MAX_CANDLES) arr.shift();
      return { candles: { ...st.candles, [tf]: arr }, lastPrice: candle.close };
    }),

  setOrderBook: (orderBook) => set({ orderBook }),
  pushTrade: (t) => set((st) => ({ trades: [t, ...st.trades].slice(0, 60), lastPrice: t.price })),
  addSignal: (s) => set((st) => ({ signals: [s, ...st.signals].slice(0, 50) })),
  setWsStatus: (wsStatus) => set({ wsStatus }),
  setRestOk: (restOk) => set({ restOk }),
  reset: () => set({ candles: {}, orderBook: null, trades: [], signals: [], lastPrice: 0 }),

  metrics: () => {
    const { signals } = get();
    const n = signals.length;
    return {
      signalsGenerated: n,
      avgConfidence: n ? signals.reduce((s, x) => s + x.confidence, 0) / n : 0,
      avgRiskReward: n ? signals.reduce((s, x) => s + x.riskReward, 0) / n : 0,
      buyCount: signals.filter((s) => s.side === "BUY").length,
      sellCount: signals.filter((s) => s.side === "SELL").length,
      lastUpdated: Date.now(),
    };
  },
}));
