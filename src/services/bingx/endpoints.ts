import type { MarketType, Timeframe } from "@/types";

/** BingX uses different path trees + interval codes per market. */
export const WS_URL: Record<MarketType, string> = {
  spot: "wss://open-api-ws.bingx.com/market",
  perp: "wss://open-api-swap.bingx.com/swap-market",
};

/** Interval codes accepted by each market's kline endpoint. */
export const INTERVAL: Record<Timeframe, string> = {
  "1m": "1m", "3m": "3m", "5m": "5m", "15m": "15m", "30m": "30m",
  "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w",
};

/** REST paths, relative to BINGX_REST_BASE, keyed by market. */
export const REST = {
  spot: {
    klines: "/openApi/spot/v2/market/kline",
    depth: "/openApi/spot/v1/market/depth",
    ticker: "/openApi/spot/v1/ticker/24hr",
  },
  perp: {
    klines: "/openApi/swap/v3/quote/klines",
    depth: "/openApi/swap/v2/quote/depth",
    ticker: "/openApi/swap/v2/quote/ticker",
    fundingRate: "/openApi/swap/v2/quote/premiumIndex",
    openInterest: "/openApi/swap/v2/quote/openInterest",
  },
} as const;

/** WebSocket channel/topic builders. BingX topics are `SYMBOL@channel`. */
export const wsTopic = {
  kline: (symbol: string, tf: Timeframe) => `${symbol}@kline_${INTERVAL[tf]}`,
  depth: (symbol: string, level = 20) => `${symbol}@depth${level}`,
  trade: (symbol: string) => `${symbol}@trade`,
  ticker: (symbol: string) => `${symbol}@ticker`,
};
