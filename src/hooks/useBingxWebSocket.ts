"use client";
import { useEffect } from "react";
import { getWsManager } from "@/services/bingx/wsManager";
import { wsTopic } from "@/services/bingx/endpoints";
import { useMarketStore } from "@/store/useMarketStore";
import type { Candle, MarketType, Timeframe } from "@/types";

type WsKline = Record<string, string | number | boolean | undefined>;

/**
 * Subscribe to kline + depth + trade streams for the active symbol and keep
 * the market store in sync. Parsing is defensive because BingX payload shapes
 * differ slightly between spot and swap.
 */
export function useBingxWebSocket(market: MarketType, symbol: string, tf: Timeframe): void {
  useEffect(() => {
    const { upsertCandle, setOrderBook, pushTrade, setWsStatus } = useMarketStore.getState();
    const mgr = getWsManager(market);
    const offStatus = mgr.onStatus(setWsStatus);

    const offMsg = mgr.onMessage((topic, data) => {
      if (topic.includes("@kline")) {
        const k = (Array.isArray(data) ? data[0] : data) as WsKline | undefined;
        if (!k) return;
        const candle: Candle = {
          time: +(k.T ?? k.t ?? k.time ?? k.windowStart ?? 0),
          open: +(k.o ?? k.open ?? 0),
          high: +(k.h ?? k.high ?? 0),
          low: +(k.l ?? k.low ?? 0),
          close: +(k.c ?? k.close ?? 0),
          volume: +(k.v ?? k.volume ?? 0),
          closed: Boolean(k.x ?? false),
        };
        if (candle.time) upsertCandle(tf, candle);
      } else if (topic.includes("@depth")) {
        const d = data as { bids?: [string, string][]; asks?: [string, string][] };
        const toL = (a: [string, string][] = []) => a.map(([p, s]) => ({ price: +p, size: +s }));
        setOrderBook({ symbol, bids: toL(d.bids), asks: toL(d.asks), ts: Date.now() });
      } else if (topic.includes("@trade")) {
        const t = (Array.isArray(data) ? data[0] : data) as WsKline | undefined;
        if (t) {
          pushTrade({
            price: +(t.p ?? t.price ?? 0),
            qty: +(t.q ?? t.qty ?? 0),
            side: (t.m ?? t.buyerMaker) ? "sell" : "buy",
            ts: +(t.T ?? Date.now()),
          });
        }
      }
    });

    mgr.connect();
    const topics = [wsTopic.kline(symbol, tf), wsTopic.depth(symbol, 20), wsTopic.trade(symbol)];
    topics.forEach((t) => mgr.subscribe(t));

    return () => {
      topics.forEach((t) => mgr.unsubscribe(t));
      offMsg();
      offStatus();
    };
  }, [market, symbol, tf]);
}
