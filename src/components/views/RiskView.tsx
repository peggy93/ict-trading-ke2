"use client";
import { useRiskStore } from "@/store/useRiskStore";
import { useMarketStore } from "@/store/useMarketStore";
import { positionSize } from "@/lib/engine/signals/risk";
import { Card, NumberField, Toggle, StatCard } from "@/components/ui";

/**
 * Risk-management configuration. Drives position sizing and paper-trading
 * guardrails; never modifies the detection strategy.
 */
export function RiskView() {
  const risk = useRiskStore();
  const signal = useMarketStore((s) => s.signals[0]);
  const lastPrice = useMarketStore((s) => s.lastPrice);

  // Live sizing preview from the latest signal (or a 1% synthetic stop).
  const entry = signal?.entry ?? lastPrice ?? 0;
  const stop = signal?.stopLoss ?? (entry ? entry * 0.99 : 0);
  const units =
    risk.sizingMode === "fixed"
      ? risk.fixedLotSize
      : entry && stop
        ? positionSize(risk.accountEquity, risk.riskPercent, entry, stop)
        : 0;
  const riskAmount = (risk.accountEquity * risk.riskPercent) / 100;
  const maxDailyLoss = (risk.accountEquity * risk.maxDailyLossPct) / 100;
  const notional = units * entry;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Risk / Trade" value={`$${riskAmount.toFixed(2)}`} sub={`${risk.riskPercent}% of equity`} />
        <StatCard label="Position Size" value={units.toFixed(4)} sub={risk.sizingMode === "fixed" ? "fixed lot" : "dynamic"} />
        <StatCard label="Est. Notional" value={`$${notional.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <StatCard label="Max Daily Loss" value={`$${maxDailyLoss.toFixed(0)}`} sub={`${risk.maxDailyLossPct}%`} tone="text-[var(--down)]" />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card title="Capital & Sizing">
          <div className="space-y-3">
            <NumberField label="Account equity (USD)" value={risk.accountEquity} min={0} step={100} onChange={(v) => risk.set({ accountEquity: v })} />
            <label className="block text-xs text-muted">
              Sizing mode
              <select
                value={risk.sizingMode}
                onChange={(e) => risk.set({ sizingMode: e.target.value as "percent" | "fixed" })}
                className="panel-2 mt-1 w-full px-2 py-1.5 text-sm"
              >
                <option value="percent">Dynamic (risk % of equity)</option>
                <option value="fixed">Fixed lot size</option>
              </select>
            </label>
            <NumberField label="Risk per trade" value={risk.riskPercent} min={0.1} max={10} step={0.1} suffix="%" onChange={(v) => risk.set({ riskPercent: v })} />
            <NumberField label="Fixed lot size" value={risk.fixedLotSize} min={0} step={0.001} onChange={(v) => risk.set({ fixedLotSize: v })} />
          </div>
        </Card>

        <Card title="Guardrails">
          <div className="space-y-3">
            <NumberField label="Max daily loss" value={risk.maxDailyLossPct} min={0} max={100} step={0.5} suffix="%" onChange={(v) => risk.set({ maxDailyLossPct: v })} />
            <NumberField label="Max drawdown" value={risk.maxDrawdownPct} min={0} max={100} step={0.5} suffix="%" onChange={(v) => risk.set({ maxDrawdownPct: v })} />
            <NumberField label="Max open positions" value={risk.maxOpenPositions} min={1} max={20} step={1} onChange={(v) => risk.set({ maxOpenPositions: v })} />
            <NumberField label="Stop after target profit" value={risk.profitTargetR} min={0} step={0.5} suffix="R" onChange={(v) => risk.set({ profitTargetR: v })} />
          </div>
        </Card>

        <Card title="Trade Management">
          <div className="space-y-3">
            <Toggle label="Auto break-even" checked={risk.autoBreakEven} onChange={(v) => risk.set({ autoBreakEven: v })} />
            <NumberField label="Break-even at" value={risk.breakEvenAtR} min={0} step={0.1} suffix="R" onChange={(v) => risk.set({ breakEvenAtR: v })} />
            <Toggle label="Trailing stop" checked={risk.trailingStop} onChange={(v) => risk.set({ trailingStop: v })} />
            <NumberField label="Trailing distance" value={risk.trailingAtrMult} min={0.1} step={0.1} suffix="× ATR" onChange={(v) => risk.set({ trailingAtrMult: v })} />
          </div>
        </Card>

        <Card title="Partial Take Profit">
          <div className="space-y-3">
            <Toggle label="Enable partial TP" checked={risk.partialTakeProfit} onChange={(v) => risk.set({ partialTakeProfit: v })} />
            <NumberField label="Close at TP1" value={risk.partialTp1Pct} min={0} max={100} step={5} suffix="%" onChange={(v) => risk.set({ partialTp1Pct: v })} />
            <button onClick={() => risk.reset()} className="panel-2 mt-2 px-3 py-1.5 text-sm hover-app">
              Reset to defaults
            </button>
          </div>
        </Card>
      </div>

      <p className="text-[11px] text-subtle">
        These settings size positions and govern the paper-trading simulation. Live broker
        execution is not connected; sizing output is advisory.
      </p>
    </div>
  );
}
