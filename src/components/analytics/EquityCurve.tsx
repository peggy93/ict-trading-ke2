"use client";
import { useMemo } from "react";
import type { EquityPoint } from "@/types";
import { EmptyState } from "@/components/ui";

/** Lightweight dependency-free SVG equity curve (cumulative R). */
export function EquityCurve({ points, height = 160 }: { points: EquityPoint[]; height?: number }) {
  const geom = useMemo(() => {
    if (points.length < 2) return null;
    const ys = points.map((p) => p.equityR);
    const min = Math.min(0, ...ys);
    const max = Math.max(0, ...ys);
    const span = max - min || 1;
    const w = 100; // viewBox width (percent-like units)
    const h = height;
    const stepX = w / (points.length - 1);
    const toY = (v: number) => h - ((v - min) / span) * h;
    const coords = points.map((p, i) => `${(i * stepX).toFixed(2)},${toY(p.equityR).toFixed(2)}`);
    const line = coords.join(" ");
    const area = `0,${toY(min).toFixed(2)} ${line} ${w},${toY(min).toFixed(2)}`;
    const zeroY = toY(0);
    const last = ys.at(-1)!;
    return { line, area, zeroY, w, h, last };
  }, [points, height]);

  if (!geom) return <EmptyState>Not enough closed trades to plot an equity curve.</EmptyState>;

  const up = geom.last >= 0;
  const stroke = up ? "var(--up)" : "var(--down)";

  return (
    <svg viewBox={`0 0 ${geom.w} ${geom.h}`} preserveAspectRatio="none" className="h-40 w-full" role="img" aria-label="Equity curve">
      <defs>
        <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={geom.zeroY} x2={geom.w} y2={geom.zeroY} stroke="var(--border-strong)" strokeWidth="0.4" strokeDasharray="1.5" />
      <polygon points={geom.area} fill="url(#eq-fill)" />
      <polyline points={geom.line} fill="none" stroke={stroke} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
