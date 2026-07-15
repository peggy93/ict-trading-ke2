"use client";
import { useEffect, useRef } from "react";
import type { IctSnapshot } from "@/types";
import { useSettingsStore } from "@/store/useSettingsStore";
import { dispatchAlert } from "@/services/alerts/alertService";
import { killzoneStatus } from "@/lib/engine/sessions";

/**
 * Raises alerts for structure/liquidity/session events on the active snapshot,
 * gated by the user's per-event preferences. Each event type is de-duplicated
 * by its most-recent timestamp so a given occurrence fires at most once.
 */
export function useEventAlerts(active: IctSnapshot | undefined): void {
  const { alerts, symbol } = useSettingsStore();
  const seen = useRef({ struct: 0, sweep: 0, ob: 0, fvg: 0 });
  const kzActive = useRef(false);

  // Structure / liquidity / order block / FVG events.
  useEffect(() => {
    if (!active) return;
    const ev = alerts.events;

    const struct = active.structure.at(-1);
    if (struct && struct.time > seen.current.struct) {
      seen.current.struct = struct.time;
      const isChoch = struct.type === "CHoCH" || struct.type === "MSS";
      if ((isChoch && ev.choch) || (struct.type === "BOS" && ev.bos)) {
        void dispatchAlert(
          `${struct.type} · ${symbol}`,
          `${struct.direction} ${struct.type} on ${active.timeframe} @ ${struct.price.toFixed(2)}`,
          struct.direction === "bullish",
          alerts,
          `struct-${struct.time}`,
        );
      }
    }

    const sweep = active.sweeps.at(-1);
    if (ev.sweep && sweep && sweep.time > seen.current.sweep) {
      seen.current.sweep = sweep.time;
      void dispatchAlert(
        `Liquidity ${sweep.kind} · ${symbol}`,
        `${sweep.direction} ${sweep.kind} @ ${sweep.price.toFixed(2)}`,
        sweep.direction === "bullish",
        alerts,
        `sweep-${sweep.time}`,
      );
    }

    const ob = active.orderBlocks.at(-1);
    if (ev.orderBlock && ob && ob.time > seen.current.ob) {
      seen.current.ob = ob.time;
      void dispatchAlert(`Order Block · ${symbol}`, `${ob.kind} (${ob.direction}) ${ob.bottom.toFixed(2)}–${ob.top.toFixed(2)}`, ob.direction === "bullish", alerts, `ob-${ob.time}`);
    }

    const fvg = active.fvgs.filter((f) => !f.mitigated).at(-1);
    if (ev.fvg && fvg && fvg.time > seen.current.fvg) {
      seen.current.fvg = fvg.time;
      void dispatchAlert(`FVG · ${symbol}`, `${fvg.kind} (${fvg.direction}) CE ${fvg.ce.toFixed(2)}`, fvg.direction === "bullish", alerts, `fvg-${fvg.time}`);
    }
  }, [active, alerts, symbol]);

  // Session / kill zone open alerts (polled independently of price ticks).
  useEffect(() => {
    const check = () => {
      const anyActive = killzoneStatus().some((k) => k.active);
      if (anyActive && !kzActive.current && alerts.events.session) {
        const kz = killzoneStatus().find((k) => k.active);
        void dispatchAlert("Kill zone open", `${kz?.name ?? "Session"} is now active`, true, alerts, "kz-open");
      }
      kzActive.current = anyActive;
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [alerts]);
}
