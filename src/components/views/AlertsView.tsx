"use client";
import { useSettingsStore } from "@/store/useSettingsStore";
import {
  dispatchAlert,
  ensureNotificationPermission,
  type AlertChannels,
  type AlertEvents,
} from "@/services/alerts/alertService";
import { Card, Toggle } from "@/components/ui";

const CHANNELS: { key: keyof AlertChannels; label: string; note?: string }[] = [
  { key: "browser", label: "Browser notifications" },
  { key: "sound", label: "Sound alerts" },
  { key: "telegram", label: "Telegram", note: "server relay" },
  { key: "discord", label: "Discord", note: "server relay" },
  { key: "email", label: "Email", note: "requires SMTP setup" },
  { key: "push", label: "Push", note: "requires service worker" },
];

const EVENTS: { key: keyof AlertEvents; label: string }[] = [
  { key: "signals", label: "Buy / Sell signals" },
  { key: "bos", label: "Break of Structure (BOS)" },
  { key: "choch", label: "Change of Character (CHoCH)" },
  { key: "orderBlock", label: "Order Block tap" },
  { key: "fvg", label: "Fair Value Gap" },
  { key: "sweep", label: "Liquidity sweep" },
  { key: "session", label: "Session / kill zone open" },
];

/** Configure alert channels and which strategy events raise notifications. */
export function AlertsView() {
  const alerts = useSettingsStore((s) => s.alerts);
  const setAlerts = useSettingsStore((s) => s.setAlerts);

  const setChannel = async (key: keyof AlertChannels, value: boolean) => {
    if (key === "browser" && value) await ensureNotificationPermission();
    setAlerts({ [key]: value });
  };

  const setEvent = (key: keyof AlertEvents, value: boolean) =>
    setAlerts({ events: { ...alerts.events, [key]: value } });

  const sendTest = () =>
    void dispatchAlert("Test alert", "Your ICT dashboard alerts are configured correctly.", true, alerts, "test");

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Card
        title="Channels"
        right={
          <button onClick={sendTest} className="panel-2 px-2 py-1 text-xs hover-app">
            Send test
          </button>
        }
      >
        <div className="space-y-3">
          {CHANNELS.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted">
                {c.label}
                {c.note && <span className="ml-1 text-[11px] text-subtle">({c.note})</span>}
              </span>
              <Toggle checked={alerts[c.key]} onChange={(v) => void setChannel(c.key, v)} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Event Triggers">
        <div className="space-y-3">
          {EVENTS.map((e) => (
            <Toggle
              key={e.key}
              label={e.label}
              checked={alerts.events[e.key]}
              onChange={(v) => setEvent(e.key, v)}
            />
          ))}
        </div>
      </Card>

      <p className="text-[11px] text-subtle md:col-span-2">
        Telegram &amp; Discord relay through the server route <code>/api/alerts</code> so tokens stay
        server-side (configure them in <code>.env.local</code>). Email and push are configuration
        placeholders — wiring an SMTP provider / service worker enables them without UI changes.
      </p>
    </div>
  );
}
