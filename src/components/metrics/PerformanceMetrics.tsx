"use client";
import { useMarketStore } from "@/store/useMarketStore";
import { Panel, SectionTitle, Stat } from "@/components/ui";

/** Session performance metrics derived from generated signals. */
export function PerformanceMetricsPanel() {
  // Subscribe to signals so metrics recompute when new ones arrive.
  const signals = useMarketStore((s) => s.signals);
  const n = signals.length;
  const avgConfidence = n ? signals.reduce((s, x) => s + x.confidence, 0) / n : 0;
  const avgRr = n ? signals.reduce((s, x) => s + x.riskReward, 0) / n : 0;
  const buys = signals.filter((s) => s.side === "BUY").length;
  const sells = n - buys;

  return (
    <Panel className="p-3">
      <SectionTitle>Performance Metrics</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Signals" value={n} />
        <Stat label="Avg Confidence" value={`${avgConfidence.toFixed(0)}%`} />
        <Stat label="Avg R:R" value={avgRr.toFixed(2)} />
        <Stat label="Buy / Sell" value={`${buys} / ${sells}`} />
      </div>
    </Panel>
  );
}
