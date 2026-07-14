import pako from "pako";
import type { MarketType } from "@/types";
import { WS_URL } from "./endpoints";
import { uid } from "@/lib/utils";

type Listener = (topic: string, payload: unknown) => void;
export type WsStatus = "connecting" | "open" | "closed" | "error";

/**
 * One socket per market. Handles:
 *  - GZIP-decompression of binary frames (pako)
 *  - Ping/Pong heartbeat (BingX sends "Ping", we reply "Pong")
 *  - Exponential-backoff auto-reconnect with re-subscription
 *  - Topic-level subscription refcounting so panels share one socket
 */
export class BingxWsManager {
  private ws: WebSocket | null = null;
  private readonly subs = new Map<string, number>(); // topic -> refcount
  private readonly listeners = new Set<Listener>();
  private readonly statusListeners = new Set<(s: WsStatus) => void>();
  private backoff = 1000;
  private closedByUser = false;
  private pingTimer?: ReturnType<typeof setInterval>;
  private status: WsStatus = "closed";

  constructor(private readonly market: MarketType) {}

  onMessage(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onStatus(fn: (s: WsStatus) => void): () => void {
    this.statusListeners.add(fn);
    fn(this.status); // emit current status immediately
    return () => this.statusListeners.delete(fn);
  }

  private emitStatus(s: WsStatus) {
    this.status = s;
    this.statusListeners.forEach((f) => f(s));
  }

  connect(): void {
    if (typeof WebSocket === "undefined") return; // SSR guard
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.closedByUser = false;
    this.emitStatus("connecting");

    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_URL[this.market]);
    } catch {
      this.emitStatus("error");
      this.scheduleReconnect();
      return;
    }
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    ws.onopen = () => {
      this.backoff = 1000;
      this.emitStatus("open");
      // Re-subscribe everything after a reconnect.
      for (const topic of this.subs.keys()) {
        this.send({ id: uid(), reqType: "sub", dataType: topic });
      }
      this.pingTimer = setInterval(() => this.send({ ping: Date.now() }), 15_000);
    };

    ws.onmessage = (ev) => {
      const text = this.decode(ev.data);
      if (!text) return;
      if (text === "Ping") { this.raw("Pong"); return; } // heartbeat (text form)
      try {
        const msg = JSON.parse(text);
        if (msg.ping) { this.send({ pong: msg.ping }); return; }
        const topic: string = msg.dataType ?? msg.topic ?? "";
        if (topic && msg.data !== undefined) {
          this.listeners.forEach((l) => l(topic, msg.data));
        }
      } catch {
        /* ignore non-JSON control frames */
      }
    };

    ws.onerror = () => this.emitStatus("error");
    ws.onclose = () => {
      this.emitStatus("closed");
      clearInterval(this.pingTimer);
      if (!this.closedByUser) this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    const delay = Math.min(this.backoff, 30_000);
    setTimeout(() => this.connect(), delay);
    this.backoff = Math.min(this.backoff * 2, 30_000); // exponential, capped
  }

  /** GZIP-decompress binary frames; pass through plain text. */
  private decode(data: ArrayBuffer | string): string | null {
    if (typeof data === "string") return data;
    try {
      return pako.ungzip(new Uint8Array(data), { to: "string" });
    } catch {
      return null;
    }
  }

  private send(obj: unknown) { this.raw(JSON.stringify(obj)); }
  private raw(s: string) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(s);
  }

  subscribe(topic: string): void {
    const n = this.subs.get(topic) ?? 0;
    this.subs.set(topic, n + 1);
    if (n === 0) this.send({ id: uid(), reqType: "sub", dataType: topic });
  }

  unsubscribe(topic: string): void {
    const n = (this.subs.get(topic) ?? 1) - 1;
    if (n <= 0) {
      this.subs.delete(topic);
      this.send({ id: uid(), reqType: "unsub", dataType: topic });
    } else {
      this.subs.set(topic, n);
    }
  }

  close(): void {
    this.closedByUser = true;
    clearInterval(this.pingTimer);
    this.ws?.close();
  }
}

/** Singleton per market so all hooks share one socket. */
const managers = new Map<MarketType, BingxWsManager>();
export function getWsManager(market: MarketType): BingxWsManager {
  let m = managers.get(market);
  if (!m) {
    m = new BingxWsManager(market);
    managers.set(market, m);
  }
  return m;
}
