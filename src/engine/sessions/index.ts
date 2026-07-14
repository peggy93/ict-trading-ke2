import type { Bias, Candle, KillzoneInfo, KillzoneName, SessionInfo, SessionName } from "@/types";
import { KILLZONES, SESSIONS } from "@/config/constants";

const HOUR = 3_600_000;

/** UTC hour helper that also returns the ms timestamp of the UTC day start. */
function utcParts(now = Date.now()) {
  const d = new Date(now);
  const hour = d.getUTCHours() + d.getUTCMinutes() / 60;
  const dayStart = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return { hour, dayStart };
}

/** Live status of Asia/London/NY sessions + whether we're in a kill zone. */
export function sessionStatus(now = Date.now()): SessionInfo[] {
  const { hour } = utcParts(now);
  return (Object.keys(SESSIONS) as SessionName[]).map((name) => {
    const s = SESSIONS[name];
    const active = hour >= s.openUtc && hour < s.closeUtc;
    const killzone = hour >= s.kzStartUtc && hour < s.kzEndUtc;
    const opensInMs = active ? 0 : ((s.openUtc - hour + 24) % 24) * HOUR;
    const closesInMs = active ? (s.closeUtc - hour) * HOUR : 0;
    return { name, active, killzone, opensInMs, closesInMs };
  });
}

/** Named ICT killzones (Asian KZ, London Open, NY Open, London Close). */
export function killzoneStatus(now = Date.now()): KillzoneInfo[] {
  const { hour } = utcParts(now);
  return (Object.keys(KILLZONES) as KillzoneName[]).map((name) => {
    const k = KILLZONES[name];
    const active = hour >= k.startUtc && hour < k.endUtc;
    const startsInMs = active ? 0 : ((k.startUtc - hour + 24) % 24) * HOUR;
    const endsInMs = active ? (k.endUtc - hour) * HOUR : 0;
    return { name, active, startsInMs, endsInMs };
  });
}

/**
 * Session bias derived from the Asian range: price above the Asian session
 * high leans bullish, below the low leans bearish (classic ICT premise that
 * London/NY expand out of the Asian accumulation).
 */
export function sessionBias(candles: Candle[], now = Date.now()): Bias {
  const asia = sessionHighLow(candles, "Asia", now);
  const price = candles.at(-1)?.close;
  if (!asia || price == null) return "neutral";
  if (price > asia.high) return "bullish";
  if (price < asia.low) return "bearish";
  return "neutral";
}

/** Compute session high/low from intraday candles for the current UTC day. */
export function sessionHighLow(
  candles: Candle[],
  name: SessionName,
  now = Date.now(),
): { high: number; low: number } | null {
  const { dayStart } = utcParts(now);
  const s = SESSIONS[name];
  const from = dayStart + s.openUtc * HOUR;
  const to = dayStart + s.closeUtc * HOUR;
  const inWindow = candles.filter((c) => c.time >= from && c.time <= to);
  if (!inWindow.length) return null;
  return {
    high: Math.max(...inWindow.map((c) => c.high)),
    low: Math.min(...inWindow.map((c) => c.low)),
  };
}
