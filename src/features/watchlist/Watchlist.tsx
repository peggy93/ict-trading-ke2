"use client";
import { useState } from "react";
import { useWatchlistStore } from "@/store/useWatchlistStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { Panel, SectionTitle, biasTone, Pill } from "@/components/ui";

/** Multi-symbol watchlist with live bias + one-click symbol switching. */
export function Watchlist() {
  const items = useWatchlistStore((s) => s.items);
  const add = useWatchlistStore((s) => s.add);
  const remove = useWatchlistStore((s) => s.remove);
  const { symbol, market, set } = useSettingsStore();
  const [input, setInput] = useState("");

  const submit = () => {
    const sym = input.toUpperCase().trim();
    if (sym) {
      add(sym, market);
      setInput("");
    }
  };

  return (
    <Panel className="p-3">
      <SectionTitle>Watchlist</SectionTitle>
      <div className="mb-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Add symbol…"
          className="panel-2 mono flex-1 px-2 py-1 text-xs"
        />
        <button onClick={submit} className="panel-2 px-2 py-1 text-xs hover:bg-slate-800">
          Add
        </button>
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li
            key={it.symbol}
            className={`flex items-center justify-between rounded px-2 py-1 text-xs ${
              it.symbol === symbol ? "bg-slate-800/60" : "hover:bg-slate-800/30"
            }`}
          >
            <button className="mono flex-1 text-left" onClick={() => set({ symbol: it.symbol })}>
              {it.symbol}
            </button>
            <span className="flex items-center gap-2">
              <Pill tone={it.bias === "bullish" ? "up" : it.bias === "bearish" ? "down" : "muted"}>
                {it.bias}
              </Pill>
              {it.lastSignal && (
                <span className={biasTone(it.lastSignal.side === "BUY" ? "bullish" : "bearish")}>
                  {it.lastSignal.side}
                </span>
              )}
              <button
                onClick={() => remove(it.symbol)}
                className="text-slate-600 hover:text-slate-300"
                aria-label={`Remove ${it.symbol}`}
              >
                ×
              </button>
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
