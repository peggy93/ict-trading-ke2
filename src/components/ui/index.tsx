"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Bias, Direction } from "@/types";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("panel", className)}>{children}</div>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-medium text-slate-200">{children}</h2>
      {right}
    </div>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="panel-2 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={cn("mono text-sm font-semibold", tone)}>{value}</div>
    </div>
  );
}

/** Bias-colored helper class. */
export const biasTone = (b: Bias | Direction): string =>
  b === "bullish" ? "text-[var(--up)]" : b === "bearish" ? "text-[var(--down)]" : "text-slate-400";

export function Pill({ children, tone }: { children: ReactNode; tone?: "up" | "down" | "muted" | "accent" }) {
  const cls =
    tone === "up"
      ? "bg-emerald-900/50 text-emerald-300"
      : tone === "down"
        ? "bg-rose-900/50 text-rose-300"
        : tone === "accent"
          ? "bg-indigo-900/50 text-indigo-300"
          : "bg-slate-800 text-slate-300";
  return <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", cls)}>{children}</span>;
}

export function ProgressBar({ value, tone }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded bg-slate-800">
      <div className={cn("h-full rounded", tone ?? "bg-[var(--accent)]")} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
