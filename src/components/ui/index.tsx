"use client";
import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Bias, Direction } from "@/types";

/* ------------------------------------------------------------------ layout */

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("panel", className)}>{children}</div>;
}

export function Card({
  title,
  right,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("panel p-3", className)}>
      {(title || right) && (
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-medium text-strong">{title}</h2>
          {right}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-sm font-medium text-strong">{children}</h2>
      {right}
    </div>
  );
}

/* -------------------------------------------------------------------- stats */

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="panel-2 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-subtle">{label}</div>
      <div className={cn("mono text-sm font-semibold", tone)}>{value}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="panel-2 px-3 py-3">
      <div className="text-[11px] uppercase tracking-wide text-subtle">{label}</div>
      <div className={cn("mono mt-1 text-xl font-semibold", tone)}>{value}</div>
      {sub != null && <div className="mt-0.5 text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------- chips */

/** Bias-colored text helper. */
export const biasTone = (b: Bias | Direction): string =>
  b === "bullish" ? "text-[var(--up)]" : b === "bearish" ? "text-[var(--down)]" : "text-muted";

type Tone = "up" | "down" | "muted" | "accent";

function toneStyle(tone: Tone): { style: CSSProperties; color: string } {
  const map: Record<Tone, string> = {
    up: "var(--up)",
    down: "var(--down)",
    accent: "var(--accent)",
    muted: "var(--muted)",
  };
  const c = map[tone];
  return {
    color: tone === "muted" ? "var(--text)" : c,
    style: {
      backgroundColor:
        tone === "muted"
          ? "var(--chip)"
          : `color-mix(in srgb, ${c} 16%, transparent)`,
    },
  };
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: Tone }) {
  const t = toneStyle(tone);
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ ...t.style, color: t.color }}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ value, tone }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded" style={{ background: "var(--chip)" }}>
      <div
        className={cn("h-full rounded", tone ?? "bg-[var(--accent)]")}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ controls */

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      {label && <span className="text-muted">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{ background: checked ? "var(--accent)" : "var(--chip)" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
          style={{ left: checked ? "1.125rem" : "0.125rem" }}
        />
      </button>
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  ...rest
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block text-xs text-muted">
      {label}
      <div className="mt-1 flex items-center gap-2">
        <input
          type="number"
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="panel-2 mono w-full px-2 py-1.5 text-sm"
          {...rest}
        />
        {suffix && <span className="text-xs text-subtle">{suffix}</span>}
      </div>
    </label>
  );
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "rounded px-3 py-1.5 text-sm transition-colors",
            active === t.id ? "text-[var(--accent-contrast)]" : "text-muted hover-app",
          )}
          style={active === t.id ? { background: "var(--accent)" } : undefined}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-xs text-subtle">{children}</p>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden
      />
      {label ?? "Loading…"}
    </div>
  );
}
