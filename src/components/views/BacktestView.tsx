"use client";
import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { fetchKlines } from "@/services/bingx/rest";
import { runBacktest, DEFAULT_BACKTEST_PARAMS } from "@/lib/backtest/backtester";
import { toCsv, downloadCsv } from "@/lib/export/csv";
import type { BacktestParams, BacktestResult } from "@/types";
import { Card, StatCard, NumberField, Spinner, EmptyState } from "@/components/ui";
import { EquityCurve } from "@/components/analytics/EquityCurve";
import { TradeHistoryTable } from "@/components/analytics/TradeHistoryTable";

/**
 * Historical backtest runner. Fetches klines for the active instrument and
 * replays the production engine walk-forward (see lib/backtest/backtester).
 */
export function BacktestView() {
  const { symbol, market, timeframe, apiKey, apiSecret } = useSettingsStore();
  const [limit, setLimit] = useState(500);
  const [params, setParams] = useState<BacktestParams>(DEFAULT_BACKTEST_PARAMS);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const candles = await fetchKlines(market, symbol, timeframe, limit, {
        key: apiKey,
        secret: apiSecret,
      });
      if (candles.length < params.warmup + 10) {
        throw new Error("Not enough candles returned for a meaningful backtest.");
      }
      // Defer to next tick so the spinner paints before the heavy sync run.
      await new Promise((r) => setTimeout(r, 20));
      setResult(runBacktest(candles, { symbol, market, timeframe }, params));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!result) return;
    const rows = result.trades.map((t) => ({
      side: t.side,
      entry: t.entry,
      stopLoss: t.stopLoss,
      takeProfit: t.takeProfit,
      riskReward: t.riskReward,
      confidence: t.confidence,
      status: t.status,
      rMultiple: t.rMultiple ?? "",
      openedAt: new Date(t.openedAt).toISOString(),
      closedAt: t.closedAt ? new Date(t.closedAt).toISOString() : "",
    }));
    downloadCsv(`backtest-${symbol}-${timeframe}-${Date.now()}.csv`, toCsv(rows));
  };

  const report = result?.report;
  const pf = report ? (report.profitFactor === Infinity ? "∞" : report.profitFactor.toFixed(2)) : "—";

  return (
    <div className="space-y-3">
      <Card
        title="Backtest Configuration"
        right={
          <button
            onClick={run}
            disabled={loading}
            className="rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            {loading ? "Running…" : `Run on ${symbol} ${timeframe}`}
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField label="Candles" value={limit} min={100} max={1000} step={100} onChange={setLimit} />
          <NumberField label="Min confidence" value={params.minConfidence} min={40} max={95} step={1} suffix="%" onChange={(v) => setParams({ ...params, minConfidence: v })} />
          <NumberField label="Min confirmations" value={params.minConfirmations} min={2} max={8} step={1} onChange={(v) => setParams({ ...params, minConfirmations: v })} />
          <NumberField label="Warmup bars" value={params.warmup} min={20} max={200} step={10} onChange={(v) => setParams({ ...params, warmup: v })} />
        </div>
        {error && <p className="mt-2 text-xs text-[var(--down)]">{error}</p>}
        <p className="mt-2 text-[11px] text-subtle">
          Replays the exact production engine bar-by-bar. HTF bias is approximated from the tested
          timeframe (single kline series). One position at a time.
        </p>
      </Card>

      {loading && (
        <Card>
          <Spinner label="Replaying strategy over history…" />
        </Card>
      )}

      {report && !loading && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Win Rate" value={`${report.winRate}%`} sub={`${report.wins}W / ${report.losses}L`} tone={report.winRate >= 50 ? "text-[var(--up)]" : "text-[var(--down)]"} />
            <StatCard label="Net P/L" value={`${report.netR >= 0 ? "+" : ""}${report.netR}R`} tone={report.netR >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"} />
            <StatCard label="Profit Factor" value={pf} tone={report.profitFactor >= 1 ? "text-[var(--up)]" : "text-[var(--down)]"} />
            <StatCard label="Trades" value={report.closedTrades} sub={`${report.openTrades} open`} />
            <StatCard label="Max DD" value={`-${report.maxDrawdownR}R`} tone="text-[var(--down)]" />
            <StatCard label="Expectancy" value={`${report.expectancyR}R`} />
          </div>

          <Card title="Equity Curve (R)">
            <EquityCurve points={report.equityCurve} />
          </Card>

          <Card
            title={`Trades (${result?.candlesTested ?? 0} candles tested)`}
            right={
              <button onClick={exportCsv} className="panel-2 px-2 py-1 text-xs hover-app">
                Export CSV
              </button>
            }
          >
            <TradeHistoryTable trades={result!.trades} />
          </Card>
        </>
      )}

      {!report && !loading && (
        <Card>
          <EmptyState>Configure parameters and run a backtest on the selected instrument.</EmptyState>
        </Card>
      )}
    </div>
  );
}
