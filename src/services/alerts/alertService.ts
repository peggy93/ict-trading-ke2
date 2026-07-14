import type { Signal } from "@/types";

export interface AlertPrefs {
  browser: boolean;
  sound: boolean;
  telegram: boolean;
  discord: boolean;
}

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
 * Fan out a signal to every enabled alert channel. Browser + sound run
 * client-side; Telegram + Discord are relayed through our server route so
 * tokens/webhooks never touch the client bundle.
 */
export async function fireAlerts(signal: Signal, prefs: AlertPrefs): Promise<void> {
  const title = `${signal.side} ${signal.symbol} @ ${signal.entry} (${signal.confidence}%)`;
  const body =
    `SL ${signal.stopLoss} · TP1 ${signal.takeProfit1} · TP2 ${signal.takeProfit2} · ` +
    `TP3 ${signal.takeProfit3} · RR ${signal.riskReward}\n` +
    signal.reasons.slice(0, 3).join(", ");

  if (
    prefs.browser &&
    typeof Notification !== "undefined" &&
    Notification.permission === "granted"
  ) {
    new Notification(title, { body, tag: signal.id });
  }
  if (prefs.sound) beep(signal.side === "BUY");

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
