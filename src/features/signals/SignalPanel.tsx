"use client";
import { useMarketStore } from "@/store/useMarketStore";
import { Panel, SectionTitle } from "@/components/ui";
import { SignalCard } from "./SignalCard";

/** Live feed of the most recent scored signals. */
export function SignalPanel() {
  const signals = useMarketStore((s) => s.signals);
  return (
    <Panel className="p-3">
      <SectionTitle right={<span className="text-xs text-slate-400">{signals.length}</span>}>
        Active Signals
      </SectionTitle>
      {signals.length === 0 ? (
        <p className="text-xs text-slate-500">No confluence signals yet. Waiting for setups…</p>
      ) : (
        <div className="scroll-thin max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {signals.slice(0, 10).map((s) => (
            <SignalCard key={s.id} signal={s} />
          ))}
        </div>
      )}
    </Panel>
  );
}
