"use client";
import { useMarketStore } from "@/store/useMarketStore";

/** REST + WebSocket health indicators. */
export function ConnectionBadges() {
  const wsStatus = useMarketStore((s) => s.wsStatus);
  const restOk = useMarketStore((s) => s.restOk);

  const dot = (ok: boolean, warn = false) =>
    `h-2 w-2 rounded-full ${ok ? "bg-[var(--up)]" : warn ? "bg-amber-400" : "bg-[var(--down)]"}`;

  return (
    <div className="flex items-center gap-3 text-xs text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className={dot(restOk)} /> REST
      </span>
      <span className="flex items-center gap-1.5">
        <span className={dot(wsStatus === "open", wsStatus === "connecting")} /> WS {wsStatus}
      </span>
    </div>
  );
}
