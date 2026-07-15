"use client";
import type { IctSnapshot } from "@/types";
import { useMarketStore } from "@/store/useMarketStore";
import { Card, Pill, EmptyState } from "@/components/ui";

/** Premium / discount / equilibrium + OTE band and current price location. */
export function PremiumDiscountCard({ snapshot }: { snapshot?: IctSnapshot }) {
  const lastPrice = useMarketStore((s) => s.lastPrice);
  const pd = snapshot?.premiumDiscount;

  if (!pd) {
    return (
      <Card title="Premium / Discount">
        <EmptyState>No dealing range yet.</EmptyState>
      </Card>
    );
  }

  const price = lastPrice || pd.equilibrium;
  const inPremium = price > pd.equilibrium;
  const pct = ((price - pd.rangeLow) / (pd.rangeHigh - pd.rangeLow || 1)) * 100;
  const clamped = Math.max(0, Math.min(100, pct));

  return (
    <Card
      title="Premium / Discount"
      right={<Pill tone={inPremium ? "down" : "up"}>{inPremium ? "PREMIUM" : "DISCOUNT"}</Pill>}
    >
      {/* Range visualisation */}
      <div className="relative mt-1 h-8 rounded" style={{ background: "var(--chip)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-l"
          style={{ width: "50%", background: "color-mix(in srgb, var(--up) 14%, transparent)" }}
        />
        <div
          className="absolute inset-y-0 right-0 rounded-r"
          style={{ width: "50%", background: "color-mix(in srgb, var(--down) 14%, transparent)" }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: "var(--border-strong)" }} />
        <div
          className="absolute top-0 h-8 w-0.5"
          style={{ left: `${clamped}%`, background: "var(--accent)" }}
          title={`Price ${price.toFixed(2)}`}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-subtle mono">
        <span>{pd.rangeLow.toFixed(2)}</span>
        <span>EQ {pd.equilibrium.toFixed(2)}</span>
        <span>{pd.rangeHigh.toFixed(2)}</span>
      </div>

      <div className="mt-3 space-y-1 text-xs mono">
        <div className="flex justify-between">
          <span className="text-muted">OTE band</span>
          <span className="text-[var(--accent)]">
            {Math.min(pd.ote.top, pd.ote.bottom).toFixed(2)} – {Math.max(pd.ote.top, pd.ote.bottom).toFixed(2)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 pt-1">
          {pd.retracement.map((f) => (
            <span key={f.ratio} title={f.price.toFixed(2)}>
              <Pill tone="muted">{f.label}</Pill>
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
