"use client";
import { useMarketStore } from "@/store/useMarketStore";
import { pricePrecision } from "@/lib/utils";
import { Card, Pill, ProgressBar, EmptyState } from "@/components/ui";

/**
 * The most recent signal presented as the "current trade": entry / SL / TP
 * ladder, R:R, confidence, and a live position status derived from the last
 * traded price (does not alter strategy logic — read-only projection).
 */
export function CurrentTradeCard() {
  const signal = useMarketStore((s) => s.signals[0]);
  const lastPrice = useMarketStore((s) => s.lastPrice);

  if (!signal) {
    return (
      <Card title="Current Trade">
        <EmptyState>No active setup. Waiting for confluence…</EmptyState>
      </Card>
    );
  }

  const dp = pricePrecision(signal.entry);
  const long = signal.side === "BUY";
  const risk = Math.abs(signal.entry - signal.stopLoss) || 1e-9;
  const liveR = lastPrice ? ((long ? lastPrice - signal.entry : signal.entry - lastPrice) / risk) : 0;

  let status: { label: string; tone: "up" | "down" | "muted" | "accent" } = {
    label: "In progress",
    tone: "accent",
  };
  if (lastPrice) {
    const stopped = long ? lastPrice <= signal.stopLoss : lastPrice >= signal.stopLoss;
    const target = long ? lastPrice >= signal.takeProfit2 : lastPrice <= signal.takeProfit2;
    if (stopped) status = { label: "Stopped out", tone: "down" };
    else if (target) status = { label: "Target reached", tone: "up" };
  }

  const Row = ({ label, value, tone }: { label: string; value: number; tone?: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted">{label}</span>
      <span className={`mono text-sm ${tone ?? "text-strong"}`}>{value.toFixed(dp)}</span>
    </div>
  );

  return (
    <Card
      title="Current Trade"
      right={<Pill tone={status.tone}>{status.label}</Pill>}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-base font-semibold ${long ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
          {signal.side} · {signal.symbol}
        </span>
        <span className="text-xs text-muted">
          {signal.timeframe} · RR {signal.riskReward}
        </span>
      </div>

      <div className="space-y-1">
        <Row label="Entry" value={signal.entry} />
        <Row label="Stop Loss" value={signal.stopLoss} tone="text-[var(--down)]" />
        <Row label="Take Profit 1" value={signal.takeProfit1} tone="text-[var(--up)]" />
        <Row label="Take Profit 2" value={signal.takeProfit2} tone="text-[var(--up)]" />
        <Row label="Take Profit 3" value={signal.takeProfit3} tone="text-[var(--up)]" />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted">Live R</span>
          <span className={`mono ${liveR >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
            {liveR >= 0 ? "+" : ""}
            {liveR.toFixed(2)}R
          </span>
        </div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-muted">Confidence</span>
          <span className="text-strong">{signal.confidence}%</span>
        </div>
        <ProgressBar
          value={signal.confidence}
          tone={long ? "bg-[var(--up)]" : "bg-[var(--down)]"}
        />
      </div>
    </Card>
  );
}
