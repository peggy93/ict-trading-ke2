"use client";
import { useMarketStore } from "@/store/useMarketStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { pricePrecision } from "@/lib/utils";
import { biasTone, Pill } from "@/components/ui";
import type { HtfBiasResult } from "@/lib/engine/ictEngine";

/** Live price strip + aggregated higher-timeframe bias readout. */
export function MarketHeader({ htf }: { htf: HtfBiasResult }) {
  const lastPrice = useMarketStore((s) => s.lastPrice);
  const { symbol } = useSettingsStore();
  const dp = pricePrecision(lastPrice || 1);

  return (
    <div className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-baseline gap-3">
        <span className="text-sm text-slate-400">{symbol}</span>
        <span className="mono text-2xl font-semibold">
          {lastPrice ? lastPrice.toFixed(dp) : "—"}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span>
          HTF Bias:{" "}
          <b className={biasTone(htf.bias)}>{htf.bias.toUpperCase()}</b>
          <span className="ml-1 text-xs text-slate-500">({htf.score > 0 ? "+" : ""}{htf.score})</span>
        </span>
        <div className="flex flex-wrap gap-1">
          {Object.entries(htf.votes).map(([tf, b]) => (
            <span key={tf} title={`${tf}: ${b}`}>
              <Pill tone={b === "bullish" ? "up" : b === "bearish" ? "down" : "muted"}>{tf}</Pill>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
