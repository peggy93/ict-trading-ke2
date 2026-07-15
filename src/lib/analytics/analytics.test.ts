import { describe, expect, it } from "vitest";
import type { Candle, PaperTrade, Signal } from "@/types";
import { settleTrade, tradeFromSignal } from "./tradeTracker";
import { computeReport } from "./metrics";

const candle = (time: number, high: number, low: number): Candle => ({
  time,
  open: (high + low) / 2,
  high,
  low,
  close: (high + low) / 2,
  volume: 1,
  closed: true,
});

const baseTrade = (over: Partial<PaperTrade> = {}): PaperTrade => ({
  id: "t1",
  signalId: "s1",
  symbol: "BTC-USDT",
  market: "perp",
  timeframe: "15m",
  side: "BUY",
  entry: 100,
  stopLoss: 98,
  takeProfit: 104,
  riskReward: 2,
  confidence: 80,
  openedAt: 1000,
  status: "open",
  ...over,
});

describe("analytics/tradeTracker", () => {
  it("maps a signal to an open paper trade using TP2 as target", () => {
    const signal = {
      id: "sig",
      symbol: "BTC-USDT",
      market: "perp",
      side: "BUY",
      entry: 100,
      stopLoss: 98,
      takeProfit1: 102,
      takeProfit2: 104,
      takeProfit3: 106,
      riskReward: 2,
      confidence: 75,
      timeframe: "15m",
      createdAt: 500,
    } as Signal;
    const t = tradeFromSignal(signal);
    expect(t.status).toBe("open");
    expect(t.takeProfit).toBe(104);
    expect(t.openedAt).toBe(500);
  });

  it("settles a long as a win when the target is hit", () => {
    const t = settleTrade(baseTrade(), [candle(2000, 104.5, 101)]);
    expect(t.status).toBe("win");
    expect(t.rMultiple).toBe(2);
    expect(t.reason).toBe("TP");
  });

  it("settles a long as a loss when the stop is hit", () => {
    const t = settleTrade(baseTrade(), [candle(2000, 101, 97.5)]);
    expect(t.status).toBe("loss");
    expect(t.rMultiple).toBe(-1);
  });

  it("assumes stop-first when a bar straddles both levels (conservative)", () => {
    const t = settleTrade(baseTrade(), [candle(2000, 105, 97)]);
    expect(t.status).toBe("loss");
  });

  it("ignores candles at or before the open time", () => {
    const t = settleTrade(baseTrade(), [candle(1000, 105, 90)]);
    expect(t.status).toBe("open");
  });
});

describe("analytics/metrics", () => {
  it("computes win rate, net R and profit factor", () => {
    const trades: PaperTrade[] = [
      baseTrade({ id: "a", status: "win", rMultiple: 2, closedAt: 10 }),
      baseTrade({ id: "b", status: "win", rMultiple: 2, closedAt: 20 }),
      baseTrade({ id: "c", status: "loss", rMultiple: -1, closedAt: 30 }),
      baseTrade({ id: "d", status: "open" }),
    ];
    const r = computeReport(trades);
    expect(r.totalTrades).toBe(4);
    expect(r.openTrades).toBe(1);
    expect(r.closedTrades).toBe(3);
    expect(r.wins).toBe(2);
    expect(r.losses).toBe(1);
    expect(r.winRate).toBeCloseTo(66.7, 1);
    expect(r.netR).toBe(3);
    expect(r.profitFactor).toBe(4); // 4R won / 1R lost
    expect(r.equityCurve.at(-1)?.equityR).toBe(3);
  });

  it("returns an empty report for no trades", () => {
    const r = computeReport([]);
    expect(r.totalTrades).toBe(0);
    expect(r.equityCurve).toHaveLength(0);
  });
});
