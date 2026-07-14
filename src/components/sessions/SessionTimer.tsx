"use client";
import { useEffect, useState } from "react";
import { killzoneStatus, sessionStatus } from "@/lib/engine/sessions";
import type { KillzoneInfo, SessionInfo } from "@/types";
import { Panel, SectionTitle, Pill } from "@/components/ui";

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

/** Live Asia/London/NY session + ICT kill-zone countdowns (ticks every 30s). */
export function SessionTimer() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [killzones, setKillzones] = useState<KillzoneInfo[]>([]);

  useEffect(() => {
    const tick = () => {
      setSessions(sessionStatus());
      setKillzones(killzoneStatus());
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Panel className="p-3">
      <SectionTitle>Sessions & Kill Zones</SectionTitle>
      <div className="space-y-1">
        {sessions.map((s) => (
          <div key={s.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${s.active ? "bg-[var(--up)]" : "bg-slate-600"}`} />
              {s.name}
              {s.killzone && <Pill tone="accent">KZ</Pill>}
            </span>
            <span className="mono text-slate-400">
              {s.active ? `closes ${fmt(s.closesInMs)}` : `opens ${fmt(s.opensInMs)}`}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 border-t border-slate-700 pt-2">
        <div className="flex flex-wrap gap-1">
          {killzones.map((k) => (
            <span key={k.name} title={k.active ? `ends ${fmt(k.endsInMs)}` : `starts ${fmt(k.startsInMs)}`}>
              <Pill tone={k.active ? "up" : "muted"}>{k.name.replace(/([A-Z])/g, " $1").trim()}</Pill>
            </span>
          ))}
        </div>
      </div>
    </Panel>
  );
}
