"use client";
import { useMarketStore } from "@/store/useMarketStore";
import { pricePrecision } from "@/lib/utils";
import { Panel, SectionTitle } from "@/components/ui";

/** Depth-of-market ladder with cumulative-size heat bars. */
export function OrderBookPanel() {
  const ob = useMarketStore((s) => s.orderBook);
  if (!ob || (!ob.bids.length && !ob.asks.length)) {
    return (
      <Panel className="p-4 text-sm text-slate-400">Order book loading…</Panel>
    );
  }

  const dp = pricePrecision(ob.bids[0]?.price ?? ob.asks[0]?.price ?? 1);
  const maxSize = Math.max(...[...ob.bids, ...ob.asks].map((l) => l.size), 1);

  const Row = ({ price, size, side }: { price: number; size: number; side: "bid" | "ask" }) => (
    <div className="relative flex justify-between px-2 py-0.5 text-xs mono">
      <div
        className={`absolute inset-y-0 right-0 ${side === "bid" ? "bg-emerald-900/30" : "bg-rose-900/30"}`}
        style={{ width: `${(size / maxSize) * 100}%` }}
      />
      <span className={`relative ${side === "bid" ? "text-[var(--up)]" : "text-[var(--down)]"}`}>
        {price.toFixed(dp)}
      </span>
      <span className="relative text-slate-300">{size.toFixed(3)}</span>
    </div>
  );

  const spread =
    ob.asks[0] && ob.bids[0] ? ob.asks[0].price - ob.bids[0].price : 0;

  return (
    <Panel className="p-2">
      <div className="px-2">
        <SectionTitle>Order Book</SectionTitle>
      </div>
      <div>{ob.asks.slice(0, 12).reverse().map((l, i) => <Row key={`a${i}`} {...l} side="ask" />)}</div>
      <div className="my-1 flex justify-between border-y border-slate-700 px-2 py-1 text-[11px] text-slate-500">
        <span>Spread</span>
        <span className="mono">{spread ? spread.toFixed(dp) : "—"}</span>
      </div>
      <div>{ob.bids.slice(0, 12).map((l, i) => <Row key={`b${i}`} {...l} side="bid" />)}</div>
    </Panel>
  );
}
