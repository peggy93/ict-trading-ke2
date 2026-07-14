"use client";
import type { IctSnapshot } from "@/types";
import { Panel, SectionTitle, Stat, ProgressBar } from "@/components/ui";

/** Volume intelligence: relative volume, spike, delta, cumulative delta, imbalance. */
export function VolumePanel({ snapshot }: { snapshot?: IctSnapshot }) {
  const v = snapshot?.volume;
  if (!v) {
    return <Panel className="p-4 text-sm text-slate-400">Gathering volume data…</Panel>;
  }

  const deltaPct = Math.round(v.delta * 100);
  const imbalancePct = Math.round(v.imbalance * 100);

  return (
    <Panel className="p-3">
      <SectionTitle>Volume Intelligence</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="Relative Vol"
          value={`${v.relative.toFixed(2)}×`}
          tone={v.spike ? "text-[var(--accent)]" : ""}
        />
        <Stat label="Spike" value={v.spike ? "YES" : "no"} tone={v.spike ? "text-[var(--accent)]" : "text-slate-400"} />
        <Stat label="Delta" value={`${deltaPct}%`} tone={deltaPct >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"} />
        <Stat
          label="Imbalance"
          value={`${imbalancePct}%`}
          tone={imbalancePct >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"}
        />
      </div>
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>Buy pressure</span>
          <span>Sell pressure</span>
        </div>
        <ProgressBar
          value={(v.imbalance + 1) * 50}
          tone={imbalancePct >= 0 ? "bg-[var(--up)]" : "bg-[var(--down)]"}
        />
      </div>
    </Panel>
  );
}
