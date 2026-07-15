import type { EquityPoint, PaperTrade, PeriodPerformance, PerformanceReport } from "@/types";

const EMPTY: PerformanceReport = {
  totalTrades: 0,
  openTrades: 0,
  closedTrades: 0,
  wins: 0,
  losses: 0,
  breakeven: 0,
  winRate: 0,
  profitFactor: 0,
  netR: 0,
  maxDrawdownR: 0,
  avgRiskReward: 0,
  avgWinR: 0,
  avgLossR: 0,
  expectancyR: 0,
  equityCurve: [],
  daily: [],
  monthly: [],
};

const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
const monthKey = (t: number) => new Date(t).toISOString().slice(0, 7);

/**
 * Compute a full performance report from paper trades. Pure and memoizable —
 * feed it the current trade list and render the result.
 */
export function computeReport(trades: PaperTrade[]): PerformanceReport {
  if (trades.length === 0) return EMPTY;

  const open = trades.filter((t) => t.status === "open");
  const closed = trades
    .filter((t) => t.status !== "open" && t.closedAt != null)
    .sort((a, b) => (a.closedAt ?? 0) - (b.closedAt ?? 0));

  if (closed.length === 0) {
    return { ...EMPTY, totalTrades: trades.length, openTrades: open.length };
  }

  const wins = closed.filter((t) => t.status === "win");
  const losses = closed.filter((t) => t.status === "loss");
  const breakeven = closed.filter((t) => t.status === "breakeven");

  const grossWin = wins.reduce((s, t) => s + (t.rMultiple ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + (t.rMultiple ?? 0), 0));
  const netR = closed.reduce((s, t) => s + (t.rMultiple ?? 0), 0);

  const decisive = wins.length + losses.length;
  const winRate = decisive > 0 ? (wins.length / decisive) * 100 : 0;
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : wins.length > 0 ? Infinity : 0;

  // Equity curve + max drawdown (in R).
  const equityCurve: EquityPoint[] = [];
  let equity = 0;
  let peak = 0;
  let maxDrawdownR = 0;
  for (const t of closed) {
    equity += t.rMultiple ?? 0;
    peak = Math.max(peak, equity);
    maxDrawdownR = Math.max(maxDrawdownR, peak - equity);
    equityCurve.push({ t: t.closedAt ?? 0, equityR: +equity.toFixed(3) });
  }

  const avgRiskReward = mean(closed.map((t) => t.riskReward));
  const avgWinR = wins.length ? mean(wins.map((t) => t.rMultiple ?? 0)) : 0;
  const avgLossR = losses.length ? mean(losses.map((t) => t.rMultiple ?? 0)) : 0;
  const expectancyR = netR / closed.length;

  return {
    totalTrades: trades.length,
    openTrades: open.length,
    closedTrades: closed.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    winRate: +winRate.toFixed(1),
    profitFactor: profitFactor === Infinity ? Infinity : +profitFactor.toFixed(2),
    netR: +netR.toFixed(2),
    maxDrawdownR: +maxDrawdownR.toFixed(2),
    avgRiskReward: +avgRiskReward.toFixed(2),
    avgWinR: +avgWinR.toFixed(2),
    avgLossR: +avgLossR.toFixed(2),
    expectancyR: +expectancyR.toFixed(3),
    equityCurve,
    daily: bucket(closed, dayKey),
    monthly: bucket(closed, monthKey),
  };
}

function bucket(trades: PaperTrade[], keyFn: (t: number) => string): PeriodPerformance[] {
  const map = new Map<string, PeriodPerformance>();
  for (const t of trades) {
    const key = keyFn(t.closedAt ?? 0);
    const cur = map.get(key) ?? { key, netR: 0, trades: 0, wins: 0 };
    cur.netR = +(cur.netR + (t.rMultiple ?? 0)).toFixed(3);
    cur.trades += 1;
    if (t.status === "win") cur.wins += 1;
    map.set(key, cur);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}
