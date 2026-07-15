"use client";
import { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useUiStore, type IndicatorToggles } from "@/store/useUiStore";
import { usePresetStore } from "@/store/usePresetStore";
import { CHART_TIMEFRAMES } from "@/constants";
import type { Timeframe } from "@/types";
import { Card, Toggle, NumberField, EmptyState } from "@/components/ui";

const ACCENTS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#a855f7"];

const INDICATOR_LABELS: Record<keyof IndicatorToggles, string> = {
  structure: "Market Structure",
  liquidity: "Liquidity",
  fvg: "Fair Value Gaps",
  orderBlocks: "Order Blocks",
  premiumDiscount: "Premium / Discount",
  sessions: "Sessions & Kill Zones",
  volume: "Volume",
  mtf: "Multi-Timeframe",
  orderBook: "Order Book",
  watchlist: "Watchlist",
};

/** Customization: theme, colors, indicators, strategy thresholds, presets. */
export function SettingsView() {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const { timeframe, minConfidence, minConfirmations, set } = useSettingsStore();
  const indicators = useUiStore((s) => s.indicators);
  const toggleIndicator = useUiStore((s) => s.toggleIndicator);
  const { presets, save, apply, remove } = usePresetStore();
  const [presetName, setPresetName] = useState("");

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Card title="Appearance">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Theme</span>
            <div className="flex gap-1">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="rounded px-3 py-1 text-sm capitalize"
                  style={
                    theme === t
                      ? { background: "var(--accent)", color: "var(--accent-contrast)" }
                      : { background: "var(--chip)", color: "var(--muted)" }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Accent color</span>
            <div className="flex gap-2">
              {ACCENTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAccent(c)}
                  aria-label={`Accent ${c}`}
                  className="h-6 w-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: accent === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Strategy Thresholds">
        <div className="space-y-3">
          <label className="block text-xs text-muted">
            Default timeframe
            <select
              value={timeframe}
              onChange={(e) => set({ timeframe: e.target.value as Timeframe })}
              className="panel-2 mt-1 w-full px-2 py-1.5 text-sm"
            >
              {CHART_TIMEFRAMES.map((tf) => (
                <option key={tf} value={tf}>
                  {tf}
                </option>
              ))}
            </select>
          </label>
          <NumberField label="Minimum confidence" value={minConfidence} min={40} max={95} step={1} suffix="%" onChange={(v) => set({ minConfidence: v })} />
          <NumberField label="Minimum confirmations" value={minConfirmations} min={2} max={8} step={1} onChange={(v) => set({ minConfirmations: v })} />
          <p className="text-[11px] text-subtle">
            These gate signal generation without altering the detection engine.
          </p>
        </div>
      </Card>

      <Card title="Indicators & Panels">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(INDICATOR_LABELS) as (keyof IndicatorToggles)[]).map((key) => (
            <Toggle
              key={key}
              label={INDICATOR_LABELS[key]}
              checked={indicators[key]}
              onChange={() => toggleIndicator(key)}
            />
          ))}
        </div>
      </Card>

      <Card title="Presets">
        <div className="mb-3 flex gap-2">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name"
            className="panel-2 flex-1 px-2 py-1.5 text-sm"
          />
          <button
            onClick={() => {
              if (presetName.trim()) {
                save(presetName.trim());
                setPresetName("");
              }
            }}
            className="rounded px-3 py-1.5 text-sm font-medium"
            style={{ background: "var(--accent)", color: "var(--accent-contrast)" }}
          >
            Save
          </button>
        </div>
        {presets.length === 0 ? (
          <EmptyState>No saved presets yet.</EmptyState>
        ) : (
          <ul className="space-y-1">
            {presets.map((p) => (
              <li key={p.name} className="flex items-center justify-between rounded px-2 py-1.5 hover-app">
                <span className="text-sm">
                  {p.name}
                  <span className="ml-2 text-[11px] text-subtle">
                    {p.data.symbol} · {p.data.timeframe}
                  </span>
                </span>
                <span className="flex gap-2">
                  <button onClick={() => apply(p.name)} className="text-xs text-[var(--accent)]">
                    Apply
                  </button>
                  <button onClick={() => remove(p.name)} className="text-xs text-muted hover:text-[var(--down)]">
                    Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
