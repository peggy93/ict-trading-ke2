"use client";
import { useState } from "react";
import type { Signal } from "@/types";
import { pricePrecision } from "@/lib/utils";
import { ProgressBar } from "@/components/ui";

/** Single signal with entry/SL/TP ladder, R:R, confidence bar, confluence + reasons. */
export function SignalCard({ signal }: { signal: Signal }) {
  const [open, setOpen] = useState(false);
  const dp = pricePrecision(signal.entry);
  const buy = signal.side === "BUY";

  return (
    <div
      className={`rounded-lg border p-2 ${
        buy ? "border-emerald-700/60 bg-emerald-950/30" : "border-rose-700/60 bg-rose-950/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`font-semibold ${buy ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
          {signal.side} · {signal.timeframe}
        </span>
        <span className="text-xs text-slate-400">
          RR {signal.riskReward} · HTF {signal.htfBias}
        </span>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs mono">
        <span>Entry <b>{signal.entry.toFixed(dp)}</b></span>
        <span>SL <b className="text-[var(--down)]">{signal.stopLoss.toFixed(dp)}</b></span>
        <span>TP1 <b className="text-[var(--up)]">{signal.takeProfit1.toFixed(dp)}</b></span>
        <span>TP2 <b className="text-[var(--up)]">{signal.takeProfit2.toFixed(dp)}</b></span>
        <span>TP3 <b className="text-[var(--up)]">{signal.takeProfit3.toFixed(dp)}</b></span>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Confidence</span>
          <span>{signal.confidence}%</span>
        </div>
        <div className="mt-0.5">
          <ProgressBar value={signal.confidence} tone={buy ? "bg-[var(--up)]" : "bg-[var(--down)]"} />
        </div>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-2 text-xs text-slate-400 hover:text-slate-200"
      >
        {open ? "▾" : "▸"} Confluence & reasons ({signal.reasons.length})
      </button>
      {open && (
        <div className="mt-1 space-y-1">
          <div className="flex flex-wrap gap-1">
            {signal.confluence.map((c) => (
              <span
                key={c.factor}
                title={c.detail}
                className="rounded bg-slate-800 px-1 py-0.5 text-[10px] text-slate-300"
              >
                {c.factor} {Math.round(c.score * 100)}%
              </span>
            ))}
          </div>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-slate-300">
            {signal.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
