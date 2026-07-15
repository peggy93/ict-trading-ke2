"use client";
import { useMemo } from "react";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { computeReport } from "@/lib/analytics/metrics";
import { toCsv, downloadCsv } from "@/lib/export/csv";
import { Card, StatCard, EmptyState, Pill } from "@/components/ui";
import { EquityCurve } from "@/components/analytics/EquityCurve";
import { TradeHistoryTable } from "@/components/analytics/TradeHistoryTable";

/** Performance analytics derived from the live paper-trading ledger. */
export function AnalyticsView() {
  const trades = useAnalyticsStore((s) => s.trades);
  const reset = useAnalyticsStore((s) => s.reset);

  // Recompute only when the ledger meaningfully changes.
  const key = trades.map((t) => `${t.id}:${t.status}`).join("|");
  const report = useMemo(() => computeReport(trades), [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const pf = report.profitFactor === Infinity ? "∞" : report.profitFactor.toFixed(2);

  const exportCsv = () => {
    const rows = trades.map((t) => ({
      side: t.side,
      symbol: t.symbol,
      timeframe: t.timeframe,
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
    downloadCsv(`ict-trades-${Date.now()}.csv`, toCsv(rows));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Win Rate" value={`${report.winRate}%`} sub={`${report.wins}W / ${report.losses}L`} tone={report.winRate >= 50 ? "text-[var(--up)]" : "text-[var(--down)]"} />
        <StatCard label="Net P/L" value={`${report.netR >= 0 ? "+" : ""}${report.netR}R`} tone={report.netR >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"} />
        <StatCard label="Profit Factor" value={pf} tone={report.profitFactor >= 1 ? "text-[var(--up)]" : "text-[var(--down)]"} />
        <StatCard label="Total Trades" value={report.totalTrades} sub={`${report.openTrades} open`} />
        <StatCard label="Max Drawdown" value={`-${report.maxDrawdownR}R`} tone="text-[var(--down)]" />
        <StatCard label="Avg R:R" value={report.avgRiskReward} sub={`exp ${report.expectancyR}R`} />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card title="Equity Curve (R)" className="lg:col-span-2">
          <EquityCurve points={report.equityCurve} />
        </Card>
        <Card title="Breakdown">
          <div className="space-y-2 text-sm">
            <Row label="Winning trades" value={report.wins} tone="text-[var(--up)]" />
            <Row label="Losing trades" value={report.losses} tone="text-[var(--down)]" />
            <Row label="Break-even" value={report.breakeven} />
            <Row label="Avg win" value={`+${report.avgWinR}R`} tone="text-[var(--up)]" />
            <Row label="Avg loss" value={`${report.avgLossR}R`} tone="text-[var(--down)]" />
            <Row label="Expectancy" value={`${report.expectancyR}R`} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card title="Monthly Performance">
          <PeriodList
            data={report.monthly}
            empty="No closed trades yet."
          />
        </Card>
        <Card title="Daily Performance">
          <PeriodList data={report.daily.slice(-14)} empty="No closed trades yet." />
        </Card>
      </div>

      <Card
        title="Trade History"
        right={
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} className="panel-2 px-2 py-1 text-xs hover-app">
              Export CSV
            </button>
            <button onClick={reset} className="panel-2 px-2 py-1 text-xs hover-app">
              Reset
            </button>
          </div>
        }
      >
        <TradeHistoryTable trades={trades} />
      </Card>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      <span className={`mono ${tone ?? "text-strong"}`}>{value}</span>
    </div>
  );
}

function PeriodList({
  data,
  empty,
}: {
  data: { key: string; netR: number; trades: number; wins: number }[];
  empty: string;
}) {
  if (data.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <ul className="space-y-1 text-xs">
      {data.map((d) => (
        <li key={d.key} className="flex items-center justify-between">
          <span className="mono text-muted">{d.key}</span>
          <span className="flex items-center gap-2">
            <Pill tone="muted">{d.trades}t</Pill>
            <span className={`mono ${d.netR >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
              {d.netR >= 0 ? "+" : ""}
              {d.netR}R
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
