import type { Candle, MarketType, OrderBook, Timeframe } from "@/types";
import { INTERVAL, REST } from "./endpoints";

/** Extra headers (per-user API key/secret) forwarded to the signed proxy. */
export interface ApiCredentials { key?: string; secret?: string; }

function credentialHeaders(creds?: ApiCredentials): HeadersInit | undefined {
  if (!creds?.key && !creds?.secret) return undefined;
  const h: Record<string, string> = {};
  if (creds.key) h["x-bingx-key"] = creds.key;
  if (creds.secret) h["x-bingx-secret"] = creds.secret;
  return h;
}

async function call(
  path: string,
  query: Record<string, string | number> = {},
  opts: { signed?: boolean; creds?: ApiCredentials } = {},
): Promise<unknown> {
  const qs = new URLSearchParams(
    Object.entries(query).map(([k, v]) => [k, String(v)]),
  );
  if (opts.signed) qs.set("__signed", "1");
  // `path` starts with /openApi/...; the catch-all proxy re-attaches it.
  const res = await fetch(`/api/bingx${path}?${qs.toString()}`, {
    headers: credentialHeaders(opts.creds),
  });
  if (!res.ok) throw new Error(`BingX ${path} -> HTTP ${res.status}`);
  const json = await res.json();
  // BingX wraps payloads as { code, msg, data }. Non-zero code = error.
  if (json && typeof json === "object" && "code" in json && json.code && json.code !== 0) {
    throw new Error(`BingX error ${json.code}: ${json.msg ?? "unknown"}`);
  }
  return json?.data ?? json;
}

type KlineRow = Record<string, string | number>;

/** Normalize BingX kline rows (array OR object form) into typed Candles. */
export async function fetchKlines(
  market: MarketType,
  symbol: string,
  tf: Timeframe,
  limit = 500,
  creds?: ApiCredentials,
): Promise<Candle[]> {
  const path = REST[market].klines;
  const data = await call(path, { symbol, interval: INTERVAL[tf], limit }, { creds });
  const rows: unknown[] = Array.isArray(data)
    ? data
    : ((data as { klines?: unknown[] })?.klines ?? []);

  const candles: Candle[] = rows.map((r) => {
    // Array form: [openTime, open, high, low, close, volume, closeTime, ...]
    if (Array.isArray(r)) {
      const [t, o, h, l, c, v] = r as (string | number)[];
      return {
        time: +(t ?? 0), open: +(o ?? 0), high: +(h ?? 0),
        low: +(l ?? 0), close: +(c ?? 0), volume: +(v ?? 0), closed: true,
      };
    }
    const k = r as KlineRow;
    return {
      time: +(k.time ?? k.openTime ?? k.t ?? 0),
      open: +(k.open ?? k.o ?? 0),
      high: +(k.high ?? k.h ?? 0),
      low: +(k.low ?? k.l ?? 0),
      close: +(k.close ?? k.c ?? 0),
      volume: +(k.volume ?? k.v ?? 0),
      closed: true,
    };
  });
  // Ensure ascending by time; BingX sometimes returns newest-first.
  return candles.filter((c) => c.time > 0).sort((a, b) => a.time - b.time);
}

export async function fetchOrderBook(
  market: MarketType,
  symbol: string,
  level = 20,
  creds?: ApiCredentials,
): Promise<OrderBook> {
  const data = (await call(REST[market].depth, { symbol, limit: level }, { creds })) as {
    bids?: [string, string][];
    asks?: [string, string][];
  };
  const toLevels = (arr: [string, string][] = []) =>
    arr.map(([price, size]) => ({ price: +price, size: +size }));
  return {
    symbol,
    bids: toLevels(data.bids),
    asks: toLevels(data.asks),
    ts: Date.now(),
  };
}

/** Perp-only microstructure inputs used by smart filters. */
export async function fetchFundingRate(
  symbol: string,
  creds?: ApiCredentials,
): Promise<number | null> {
  try {
    const d = await call(REST.perp.fundingRate, { symbol }, { creds });
    const row = (Array.isArray(d) ? d[0] : d) as KlineRow | undefined;
    return row ? +(row.lastFundingRate ?? row.fundingRate ?? 0) : null;
  } catch {
    return null;
  }
}

export async function fetchOpenInterest(
  symbol: string,
  creds?: ApiCredentials,
): Promise<number | null> {
  try {
    const d = await call(REST.perp.openInterest, { symbol }, { creds });
    const row = (Array.isArray(d) ? d[0] : d) as KlineRow | undefined;
    return row ? +(row.openInterest ?? row.oi ?? 0) : null;
  } catch {
    return null;
  }
}
