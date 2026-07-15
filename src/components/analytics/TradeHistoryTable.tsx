"use client";
import type { PaperTrade } from "@/types";
import { pricePrecision } from "@/lib/utils";
import { EmptyState, Pill } from "@/components/ui";

const fmtTime = (t?: number) => (t ? new Date(t).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

const statusTone = (s: PaperTrade["status"]) =>
  s === "win" ? "up" : s === "loss" ? "down" : s === "open" ? "accent" : "muted";

/** Scrollable, responsive trade history table. */
export function TradeHistoryTable({ trades }: { trades: PaperTrade[] }) {
  if (trades.length === 0) return <EmptyState>No trades recorded yet.</EmptyState>;

  return (
    <div className="scroll-thin max-h-[420px] overflow-auto">
      <table className="w-full border-collapse text-xs">
        <thead className="sticky top-0" style={{ background: "var(--panel)" }}>
          <tr className="text-left text-subtle">
            <th className="px-2 py-1.5 font-medium">Side</th>
            <th className="px-2 py-1.5 font-medium">Symbol</th>
            <th className="px-2 py-1.5 font-medium">TF</th>
            <th className="px-2 py-1.5 text-right font-medium">Entry</th>
            <th className="px-2 py-1.5 text-right font-medium">SL</th>
            <th className="px-2 py-1.5 text-right font-medium">TP</th>
            <th className="px-2 py-1.5 text-right font-medium">R</th>
            <th className="px-2 py-1.5 font-medium">Status</th>
            <th className="px-2 py-1.5 font-medium">Closed</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((t) => {
            const dp = pricePrecision(t.entry);
            return (
              <tr key={t.id} className="border-t border-app">
                <td className={`px-2 py-1.5 font-medium ${t.side === "BUY" ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
                  {t.side}
                </td>
                <td className="px-2 py-1.5 mono">{t.symbol}</td>
                <td className="px-2 py-1.5">{t.timeframe}</td>
                <td className="px-2 py-1.5 text-right mono">{t.entry.toFixed(dp)}</td>
                <td className="px-2 py-1.5 text-right mono text-[var(--down)]">{t.stopLoss.toFixed(dp)}</td>
                <td className="px-2 py-1.5 text-right mono text-[var(--up)]">{t.takeProfit.toFixed(dp)}</td>
                <td className={`px-2 py-1.5 text-right mono ${(t.rMultiple ?? 0) >= 0 ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
                  {t.rMultiple == null ? "—" : `${t.rMultiple > 0 ? "+" : ""}${t.rMultiple.toFixed(2)}`}
                </td>
                <td className="px-2 py-1.5">
                  <Pill tone={statusTone(t.status)}>{t.status}</Pill>
                </td>
                <td className="px-2 py-1.5 text-muted">{fmtTime(t.closedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
