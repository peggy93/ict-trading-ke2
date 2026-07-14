"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useWatchlistStore } from "@/store/useWatchlistStore";
import { useMultiTimeframeCandles } from "@/hooks/useMultiTimeframeCandles";
import { useBingxWebSocket } from "@/hooks/useBingxWebSocket";
import { useOrderBookSnapshot } from "@/hooks/useOrderBook";
import { useIct } from "@/hooks/useIct";
import { useSignals } from "@/hooks/useSignals";
import { CHART_TIMEFRAMES } from "@/constants";
import type { MarketType, Timeframe } from "@/types";
import { LogoIcon } from "@/assets/logo";
import { MarketHeader } from "./MarketHeader";
import { OrderBookPanel } from "@/components/orderbook/OrderBook";
import { SignalPanel } from "@/components/signals/SignalPanel";
import { StructurePanel } from "@/components/structure/StructurePanel";
import { LiquidityPanel } from "@/components/structure/LiquidityPanel";
import { SessionTimer } from "@/components/sessions/SessionTimer";
import { VolumePanel } from "@/components/volume/VolumePanel";
import { Watchlist } from "@/components/watchlist/Watchlist";
import { PerformanceMetricsPanel } from "@/components/metrics/PerformanceMetrics";
import { ConnectionBadges } from "@/components/status/ConnectionBadges";
import { ApiKeyDialog } from "@/components/settings/ApiKeyDialog";

// Chart is client-only (touches the DOM) and lazy-loaded for code splitting.
const CandleChart = dynamic(
  () => import("@/components/chart/CandleChart").then((m) => m.CandleChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[440px] items-center justify-center text-sm text-slate-500">
        Loading chart…
      </div>
    ),
  },
);

/**
 * Top-level dashboard. Owns no market data itself — it wires hooks together
 * and lays out the responsive grid. Every panel subscribes only to the store
 * slice it needs, so a price tick never re-renders the whole tree.
 */
export function DashboardShell() {
  const { symbol, market, timeframe, set } = useSettingsStore();
  const setBias = useWatchlistStore((s) => s.setBias);
  const [showKeys, setShowKeys] = useState(false);

  // Bootstrap history for every timeframe (multi-TF analysis) + stream active TF.
  useMultiTimeframeCandles(market, symbol);
  useBingxWebSocket(market, symbol, timeframe);
  useOrderBookSnapshot(market, symbol);

  const { active, htf, snapshots } = useIct(timeframe);
  useSignals({ timeframe, snapshot: active, htf: htf.bias });

  // Keep the active symbol's watchlist bias in sync with the HTF cascade.
  useEffect(() => {
    setBias(symbol, htf.bias, active?.swings.at(-1)?.price ?? 0);
  }, [symbol, htf.bias, active, setBias]);

  return (
    <div className="mx-auto max-w-[1700px] p-3 md:p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <LogoIcon className="h-5 w-5 text-[var(--accent)]" /> ICT / SMC Scanner
          </h1>
          <ConnectionBadges />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={market}
            onChange={(e) => set({ market: e.target.value as MarketType })}
            className="panel px-2 py-1 text-sm"
          >
            <option value="perp">USDT-M Perp</option>
            <option value="spot">Spot</option>
          </select>
          <input
            value={symbol}
            onChange={(e) => set({ symbol: e.target.value.toUpperCase().trim() })}
            className="panel mono w-32 px-2 py-1 text-sm"
            placeholder="BTC-USDT"
          />
          <select
            value={timeframe}
            onChange={(e) => set({ timeframe: e.target.value as Timeframe })}
            className="panel px-2 py-1 text-sm"
          >
            {CHART_TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
          <button
            onClick={() => setShowKeys(true)}
            className="panel px-3 py-1 text-sm hover:bg-slate-800"
          >
            Settings
          </button>
        </div>
      </header>

      <MarketHeader htf={htf} />

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-8">
          <div className="panel p-2">
            <CandleChart snapshot={active} />
          </div>
          <StructurePanel snapshot={active} snapshots={snapshots} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <LiquidityPanel snapshot={active} />
            <VolumePanel snapshot={active} />
          </div>
        </section>

        <aside className="space-y-3 lg:col-span-4">
          <SessionTimer />
          <SignalPanel />
          <OrderBookPanel />
          <Watchlist />
          <PerformanceMetricsPanel />
        </aside>
      </div>

      {showKeys && <ApiKeyDialog onClose={() => setShowKeys(false)} />}
    </div>
  );
}
