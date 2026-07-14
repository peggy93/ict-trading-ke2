"use client";
import type { IctSnapshot } from "@/types";
import { Panel, SectionTitle, Pill, biasTone } from "@/components/ui";

/** Liquidity readout: pools (BSL/SSL, EQH/EQL), recent sweeps, inducement. */
export function LiquidityPanel({ snapshot }: { snapshot?: IctSnapshot }) {
  if (!snapshot) {
    return <Panel className="p-4 text-sm text-slate-400">Mapping liquidity…</Panel>;
  }

  const pools = snapshot.liquidity.slice(-6);
  const sweeps = snapshot.sweeps.slice(-4).reverse();
  const inducements = snapshot.inducements.slice(-2).reverse();

  return (
    <Panel className="p-3">
      <SectionTitle>Liquidity</SectionTitle>

      <div className="mb-2">
        <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">Pools</div>
        {pools.length === 0 ? (
          <p className="text-xs text-slate-500">None</p>
        ) : (
          <div className="flex flex-wrap gap-1">
            {pools.map((l, i) => (
              <span key={i} title={`${l.quality} · strength ${l.strength}`}>
                <Pill tone={l.side === "buy" ? "up" : "down"}>
                  {l.kind} {l.price.toFixed(2)}
                </Pill>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-2">
        <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">Recent Sweeps</div>
        {sweeps.length === 0 ? (
          <p className="text-xs text-slate-500">None</p>
        ) : (
          <ul className="space-y-1 text-xs mono">
            {sweeps.map((s, i) => (
              <li key={i} className={biasTone(s.direction)}>
                {s.kind} @ {s.price.toFixed(2)} · {s.penetrationAtr}×ATR {s.reclaimed ? "· reclaimed" : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">Inducement</div>
        {inducements.length === 0 ? (
          <p className="text-xs text-slate-500">None</p>
        ) : (
          <ul className="space-y-1 text-xs mono">
            {inducements.map((n, i) => (
              <li key={i} className={biasTone(n.direction)}>
                {n.direction} @ {n.price.toFixed(2)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
