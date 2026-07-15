"use client";
import dynamic from "next/dynamic";
import type { IctSnapshot, Timeframe } from "@/types";
import type { HtfBiasResult } from "@/lib/engine/ictEngine";
import { useUiStore } from "@/store/useUiStore";
import { MarketHeader } from "@/components/dashboard/MarketHeader";
import { CurrentTradeCard } from "@/components/live/CurrentTradeCard";
import { PremiumDiscountCard } from "@/components/live/PremiumDiscountCard";
import { MtfPanel } from "@/components/live/MtfPanel";
import { StructurePanel } from "@/components/structure/StructurePanel";
import { LiquidityPanel } from "@/components/structure/LiquidityPanel";
import { VolumePanel } from "@/components/volume/VolumePanel";
import { SessionTimer } from "@/components/sessions/SessionTimer";
import { SignalPanel } from "@/components/signals/SignalPanel";
import { OrderBookPanel } from "@/components/orderbook/OrderBook";
import { Watchlist } from "@/components/watchlist/Watchlist";

const CandleChart = dynamic(
  () => import("@/components/chart/CandleChart").then((m) => m.CandleChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[440px] items-center justify-center text-sm text-muted">
        Loading chart…
      </div>
    ),
  },
);

interface Props {
  active?: IctSnapshot;
  htf: HtfBiasResult;
  snapshots: Partial<Record<Timeframe, IctSnapshot>>;
}

/** Real-time analysis view — the primary trading surface. */
export function LiveView({ active, htf, snapshots }: Props) {
  const ind = useUiStore((s) => s.indicators);

  return (
    <div className="space-y-3">
      <MarketHeader htf={htf} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <section className="space-y-3 lg:col-span-8">
          <div className="panel p-2">
            <CandleChart snapshot={active} />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <CurrentTradeCard />
            {ind.premiumDiscount && <PremiumDiscountCard snapshot={active} />}
          </div>

          {ind.structure && <StructurePanel snapshot={active} snapshots={snapshots} />}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ind.liquidity && <LiquidityPanel snapshot={active} />}
            {ind.volume && <VolumePanel snapshot={active} />}
          </div>
        </section>

        <aside className="space-y-3 lg:col-span-4">
          {ind.sessions && <SessionTimer />}
          {ind.mtf && <MtfPanel snapshots={snapshots} />}
          <SignalPanel />
          {ind.orderBook && <OrderBookPanel />}
          {ind.watchlist && <Watchlist />}
        </aside>
      </div>
    </div>
  );
}
