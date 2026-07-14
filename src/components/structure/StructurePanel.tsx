"use client";
import type { IctSnapshot, Timeframe } from "@/types";
import { Panel, SectionTitle, Stat, biasTone, Pill } from "@/components/ui";

interface Props {
  snapshot?: IctSnapshot;
  snapshots: Partial<Record<Timeframe, IctSnapshot>>;
}

/** Market-structure readout: bias, last events, protected/strong points, FVGs, OBs. */
export function StructurePanel({ snapshot }: Props) {
  if (!snapshot) {
    return <Panel className="p-4 text-sm text-slate-400">Analyzing market structure…</Panel>;
  }

  const pd = snapshot.premiumDiscount;
  const lastStruct = snapshot.structure.at(-1);
  const activeFvgs = snapshot.fvgs.filter((f) => !f.mitigated).slice(-4);
  const obs = [...snapshot.orderBlocks]
    .filter((b) => !b.mitigated)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 4);
  const protectedPt = snapshot.structuralPoints.find((p) => p.protectedPoint);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Stat label="Bias" value={snapshot.bias.toUpperCase()} tone={biasTone(snapshot.bias)} />
        <Stat
          label="Last Structure"
          value={lastStruct ? `${lastStruct.type} ${lastStruct.scope}` : "—"}
          tone={lastStruct ? biasTone(lastStruct.direction) : ""}
        />
        <Stat label="Equilibrium" value={pd ? pd.equilibrium.toFixed(2) : "—"} />
        <Stat
          label="Protected"
          value={protectedPt ? `${protectedPt.swing.kind} ${protectedPt.swing.price.toFixed(2)}` : "—"}
        />
      </div>

      <Panel className="p-3">
        <SectionTitle>Order Blocks (ranked)</SectionTitle>
        {obs.length === 0 ? (
          <p className="text-xs text-slate-500">None detected</p>
        ) : (
          <ul className="space-y-1.5 text-xs">
            {obs.map((b, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className={`mono ${biasTone(b.direction)}`}>
                  {b.kind} · {b.bottom.toFixed(2)}–{b.top.toFixed(2)}
                </span>
                <span className="flex items-center gap-2">
                  <Pill tone={b.direction === "bullish" ? "up" : "down"}>{b.confidence}%</Pill>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel className="p-3">
        <SectionTitle>Unmitigated Fair Value Gaps</SectionTitle>
        {activeFvgs.length === 0 ? (
          <p className="text-xs text-slate-500">None</p>
        ) : (
          <ul className="space-y-1 text-xs mono">
            {activeFvgs.map((f, i) => (
              <li key={i} className={biasTone(f.direction)}>
                {f.kind} {f.bottom.toFixed(2)}–{f.top.toFixed(2)} · CE {f.ce.toFixed(2)} · score {f.score}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
