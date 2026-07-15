"use client";
import { useEffect } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useWatchlistStore } from "@/store/useWatchlistStore";
import { useUiStore } from "@/store/useUiStore";
import { useMultiTimeframeCandles } from "@/hooks/useMultiTimeframeCandles";
import { useBingxWebSocket } from "@/hooks/useBingxWebSocket";
import { useOrderBookSnapshot } from "@/hooks/useOrderBook";
import { useIct } from "@/hooks/useIct";
import { useSignals } from "@/hooks/useSignals";
import { useAnalyticsTracker } from "@/hooks/useAnalyticsTracker";
import { useEventAlerts } from "@/hooks/useEventAlerts";
import { TopBar } from "@/components/layout/TopBar";
import { SideNav } from "@/components/layout/SideNav";
import { LiveView } from "@/components/views/LiveView";
import { AnalyticsView } from "@/components/views/AnalyticsView";
import { RiskView } from "@/components/views/RiskView";
import { AlertsView } from "@/components/views/AlertsView";
import { BacktestView } from "@/components/views/BacktestView";
import { SettingsView } from "@/components/views/SettingsView";

/**
 * Application shell. Owns the shared data pipeline (candles → WS → ICT engine →
 * signals → paper-trade tracker → alerts) exactly once, then routes the active
 * view. Data hooks run here so switching views never drops the live stream or
 * recomputes the strategy — preserving 100% of existing behaviour.
 */
export function DashboardShell() {
  const { symbol, market, timeframe } = useSettingsStore();
  const setBias = useWatchlistStore((s) => s.setBias);
  const view = useUiStore((s) => s.view);

  // Shared, always-on data pipeline (independent of the active view).
  useMultiTimeframeCandles(market, symbol);
  useBingxWebSocket(market, symbol, timeframe);
  useOrderBookSnapshot(market, symbol);

  const { active, htf, snapshots } = useIct(timeframe);
  useSignals({ timeframe, snapshot: active, htf: htf.bias });
  useAnalyticsTracker();
  useEventAlerts(active);

  // Keep the active symbol's watchlist bias in sync with the HTF cascade.
  useEffect(() => {
    setBias(symbol, htf.bias, active?.swings.at(-1)?.price ?? 0);
  }, [symbol, htf.bias, active, setBias]);

  return (
    <div className="min-h-screen">
      <TopBar />
      <div className="mx-auto flex max-w-[1700px] flex-col gap-3 px-3 py-3 md:px-4 lg:flex-row">
        <SideNav />
        <main className="min-w-0 flex-1">
          {view === "live" && <LiveView active={active} htf={htf} snapshots={snapshots} />}
          {view === "analytics" && <AnalyticsView />}
          {view === "risk" && <RiskView />}
          {view === "alerts" && <AlertsView />}
          {view === "backtest" && <BacktestView />}
          {view === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}
