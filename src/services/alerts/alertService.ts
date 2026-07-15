import type { Signal } from "@/types";

/** Delivery channels. email/push are configuration placeholders (see note). */
export interface AlertChannels {
  browser: boolean;
  sound: boolean;
  telegram: boolean;
  discord: boolean;
  email: boolean;
  push: boolean;
}

/** Which strategy events raise an alert. */
export interface AlertEvents {
  signals: boolean;
  bos: boolean;
  choch: boolean;
  orderBlock: boolean;
  fvg: boolean;
  sweep: boolean;
  session: boolean;
}

export interface AlertPrefs extends AlertChannels {
  events: AlertEvents;
}

export const DEFAULT_ALERTS: AlertPrefs = {
  browser: true,
  sound: true,
  telegram: false,
  discord: false,
  email: false,
  push: false,
  events: {
    signals: true,
    bos: true,
    choch: true,
    orderBlock: false,
    fvg: false,
    sweep: true,
    session: true,
  },
};

let audioCtx: AudioContext | null = null;

/** Short WebAudio beep — no asset file needed. */
function beep(up: boolean) {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    audioCtx ??= new Ctor();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.frequency.value = up ? 880 : 440;
    g.gain.setValueAtTime(0.001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    o.start();
    o.stop(audioCtx.currentTime + 0.4);
  } catch {
    /* audio not available */
  }
}

/** Ask for browser notification permission once (call from a user gesture). */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission !== "denied") {
    return (await Notification.requestPermission()) === "granted";
  }
  return false;
}

/**
 * Fan out a message to every enabled channel. Browser + sound run in the
 * client; Telegram + Discord relay through the server route so tokens never
 * touch the client bundle.
 *
 * Note: `email` and `push` are configuration placeholders. Email needs an SMTP
 * provider wired into `/api/alerts`, and push needs a service worker + VAPID
 * keys — both are intentionally left as no-ops so the UI can express intent
 * without shipping half-working transport.
 */
export async function dispatchAlert(
  title: string,
  body: string,
  up: boolean,
  prefs: AlertPrefs,
  tag?: string,
): Promise<void> {
  if (
    prefs.browser &&
    typeof Notification !== "undefined" &&
    Notification.permission === "granted"
  ) {
    new Notification(title, { body, tag });
  }
  if (prefs.sound) beep(up);

  if (prefs.telegram || prefs.discord) {
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          channels: { telegram: prefs.telegram, discord: prefs.discord },
          title,
          body,
        }),
      });
    } catch {
      /* relay failure shouldn't break the UI */
    }
  }
}

/** Alert for a generated BUY/SELL signal. */
export async function fireAlerts(signal: Signal, prefs: AlertPrefs): Promise<void> {
  if (!prefs.events.signals) return;
  const title = `${signal.side} ${signal.symbol} @ ${signal.entry} (${signal.confidence}%)`;
  const body =
    `SL ${signal.stopLoss} · TP1 ${signal.takeProfit1} · TP2 ${signal.takeProfit2} · ` +
    `TP3 ${signal.takeProfit3} · RR ${signal.riskReward}\n` +
    signal.reasons.slice(0, 3).join(", ");
  await dispatchAlert(title, body, signal.side === "BUY", prefs, signal.id);
}
