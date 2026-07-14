"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchOrderBook } from "@/services/bingx/rest";
import { useMarketStore } from "@/store/useMarketStore";
import type { MarketType } from "@/types";

/** REST snapshot of the book for initial paint; WS keeps it live afterwards. */
export function useOrderBookSnapshot(market: MarketType, symbol: string) {
  const setOrderBook = useMarketStore((s) => s.setOrderBook);
  const query = useQuery({
    queryKey: ["depth", market, symbol],
    queryFn: () => fetchOrderBook(market, symbol, 20),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) setOrderBook(query.data);
  }, [query.data, setOrderBook]);

  return query;
}
