"use client";
import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { CHART_TIMEFRAMES } from "@/constants";
import type { MarketType, Timeframe } from "@/types";
import { LogoIcon } from "@/assets/logo";
import { ConnectionBadges } from "@/components/status/ConnectionBadges";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ApiKeyDialog } from "@/components/settings/ApiKeyDialog";

/** Global top bar: brand, instrument controls, connection health, theme. */
export function TopBar() {
  const { symbol, market, timeframe, set } = useSettingsStore();
  const [showKeys, setShowKeys] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-app" style={{ background: "var(--panel)" }}>
      <div className="mx-auto flex max-w-[1700px] flex-wrap items-center justify-between gap-2 px-3 py-2 md:px-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <LogoIcon className="h-5 w-5 text-[var(--accent)]" />
            <span className="hidden sm:inline">ICT / SMC Dashboard</span>
          </span>
          <ConnectionBadges />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={market}
            onChange={(e) => set({ market: e.target.value as MarketType })}
            className="panel-2 px-2 py-1 text-sm"
            aria-label="Market"
          >
            <option value="perp">USDT-M Perp</option>
            <option value="spot">Spot</option>
          </select>
          <input
            value={symbol}
            onChange={(e) => set({ symbol: e.target.value.toUpperCase().trim() })}
            className="panel-2 mono w-28 px-2 py-1 text-sm"
            placeholder="BTC-USDT"
            aria-label="Symbol"
          />
          <select
            value={timeframe}
            onChange={(e) => set({ timeframe: e.target.value as Timeframe })}
            className="panel-2 px-2 py-1 text-sm"
            aria-label="Timeframe"
          >
            {CHART_TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowKeys(true)}
            className="panel-2 px-3 py-1 text-sm hover-app"
          >
            API Keys
          </button>
          <ThemeToggle />
        </div>
      </div>
      {showKeys && <ApiKeyDialog onClose={() => setShowKeys(false)} />}
    </header>
  );
}
