import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Bias, MarketType, Signal, WatchlistItem } from "@/types";

interface WatchlistState {
  items: WatchlistItem[];
  add: (symbol: string, market: MarketType) => void;
  remove: (symbol: string) => void;
  update: (symbol: string, patch: Partial<Omit<WatchlistItem, "symbol">>) => void;
  setBias: (symbol: string, bias: Bias, lastPrice: number) => void;
  setSignal: (symbol: string, signal: Signal) => void;
}

const DEFAULTS: WatchlistItem[] = [
  { symbol: "BTC-USDT", market: "perp", bias: "neutral", lastPrice: 0 },
  { symbol: "ETH-USDT", market: "perp", bias: "neutral", lastPrice: 0 },
  { symbol: "SOL-USDT", market: "perp", bias: "neutral", lastPrice: 0 },
];

/** Persisted multi-symbol watchlist with live bias + latest signal. */
export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      items: DEFAULTS,
      add: (symbol, market) =>
        set((st) =>
          st.items.some((i) => i.symbol === symbol)
            ? st
            : { items: [...st.items, { symbol, market, bias: "neutral", lastPrice: 0 }] },
        ),
      remove: (symbol) => set((st) => ({ items: st.items.filter((i) => i.symbol !== symbol) })),
      update: (symbol, patch) =>
        set((st) => ({
          items: st.items.map((i) => (i.symbol === symbol ? { ...i, ...patch } : i)),
        })),
      setBias: (symbol, bias, lastPrice) =>
        set((st) => ({
          items: st.items.map((i) => (i.symbol === symbol ? { ...i, bias, lastPrice } : i)),
        })),
      setSignal: (symbol, signal) =>
        set((st) => ({
          items: st.items.map((i) => (i.symbol === symbol ? { ...i, lastSignal: signal } : i)),
        })),
    }),
    { name: "ict-watchlist" },
  ),
);
