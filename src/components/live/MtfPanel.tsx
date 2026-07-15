"use client";
import type { IctSnapshot, Timeframe } from "@/types";
import { TIMEFRAMES } from "@/constants";
import { Card, biasTone, Pill } from "@/components/ui";

/** Multi-timeframe bias grid + latest structure event per timeframe. */
export function MtfPanel({ snapshots }: { snapshots: Partial<Record<Timeframe, IctSnapshot>> }) {
  return (
    <Card title="Multi-Timeframe Analysis">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
        {TIMEFRAMES.map((tf) => {
          const snap = snapshots[tf];
          const last = snap?.structure.at(-1);
          return (
            <div key={tf} className="panel-2 px-2 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-strong">{tf}</span>
                <Pill
                  tone={
                    snap?.bias === "bullish" ? "up" : snap?.bias === "bearish" ? "down" : "muted"
                  }
                >
                  {snap ? snap.bias[0]!.toUpperCase() : "–"}
                </Pill>
              </div>
              <div className={`mt-1 text-[11px] ${last ? biasTone(last.direction) : "text-subtle"}`}>
                {last ? `${last.type} ${last.scope}` : "no data"}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
