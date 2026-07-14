"use client";
import { useState } from "react";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ensureNotificationPermission } from "@/services/alerts/alertService";
import type { AlertPrefs } from "@/services/alerts/alertService";

/**
 * BingX API keys + engine/alert preferences. Keys are held in the settings
 * store (secret in memory only) and forwarded per-request via headers to the
 * server proxy — never bundled or logged. Read-only keys recommended.
 */
export function ApiKeyDialog({ onClose }: { onClose: () => void }) {
  const { apiKey, apiSecret, minConfidence, minConfirmations, alerts, set, setAlerts } =
    useSettingsStore();
  const [key, setKey] = useState(apiKey);
  const [secret, setSecret] = useState(apiSecret);
  const [conf, setConf] = useState(minConfidence);
  const [confirms, setConfirms] = useState(minConfirmations);

  const save = () => {
    set({ apiKey: key, apiSecret: secret, minConfidence: conf, minConfirmations: confirms });
    onClose();
  };

  const toggleAlert = async (k: keyof AlertPrefs, value: boolean) => {
    if (k === "browser" && value) await ensureNotificationPermission();
    setAlerts({ [k]: value });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div className="panel w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-base font-semibold">BingX API &amp; Preferences</h2>

        <label className="mb-2 block text-xs text-slate-400">
          API Key
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="panel mono mt-1 w-full px-2 py-1.5 text-sm"
          />
        </label>
        <label className="mb-2 block text-xs text-slate-400">
          API Secret (read-only key recommended; kept in memory only)
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="panel mono mt-1 w-full px-2 py-1.5 text-sm"
          />
        </label>

        <label className="mb-2 block text-xs text-slate-400">
          Min Confidence: {conf}%
          <input
            type="range"
            min={40}
            max={95}
            value={conf}
            onChange={(e) => setConf(+e.target.value)}
            className="mt-1 w-full"
          />
        </label>
        <label className="mb-3 block text-xs text-slate-400">
          Min Confirmations: {confirms}
          <input
            type="range"
            min={2}
            max={8}
            value={confirms}
            onChange={(e) => setConfirms(+e.target.value)}
            className="mt-1 w-full"
          />
        </label>

        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
          {(["browser", "sound", "telegram", "discord"] as const).map((k) => (
            <label key={k} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={alerts[k]}
                onChange={(e) => void toggleAlert(k, e.target.checked)}
              />
              {k[0]!.toUpperCase() + k.slice(1)} alerts
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="panel px-3 py-1.5 text-sm hover:bg-slate-800">
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium hover:bg-emerald-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
