"use client";
import { useEffect, useRef } from "react";
import {
  ColorType,
  createChart,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { useMarketStore } from "@/store/useMarketStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useTheme } from "@/context/ThemeContext";
import type { IctSnapshot } from "@/types";

/**
 * TradingView lightweight-charts candlestick view. Structure events render as
 * markers; premium/discount equilibrium, OTE band and fresh FVG CE levels
 * render as price lines. The series is updated imperatively (not via React
 * state) to stay low-latency under high-frequency updates.
 */
export function CandleChart({ snapshot }: { snapshot?: IctSnapshot }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const { timeframe } = useSettingsStore();
  const { theme } = useTheme();
  const candles = useMarketStore((s) => s.candles[timeframe]);

  // Create chart once.
  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(128,140,160,0.15)" },
        horzLines: { color: "rgba(128,140,160,0.15)" },
      },
      height: 440,
      autoSize: true,
      timeScale: { timeVisible: true, borderColor: "rgba(128,140,160,0.25)" },
      rightPriceScale: { borderColor: "rgba(128,140,160,0.25)" },
    });
    const series = chart.addCandlestickSeries({
      upColor: "#16c784",
      downColor: "#ea3943",
      wickUpColor: "#16c784",
      wickDownColor: "#ea3943",
      borderVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = series;
    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      priceLinesRef.current = [];
    };
  }, []);

  // Re-tint axis text when the theme changes.
  useEffect(() => {
    chartRef.current?.applyOptions({
      layout: { textColor: theme === "light" ? "#475569" : "#94a3b8" },
    });
  }, [theme]);

  // Push candle data (imperative update avoids React re-render per tick).
  useEffect(() => {
    if (!seriesRef.current || !candles) return;
    seriesRef.current.setData(
      candles.map((c) => ({
        time: (c.time / 1000) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
  }, [candles]);

  // Draw ICT overlays: structure markers + zone price lines.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !snapshot) return;

    // Structure markers (last 10 events).
    const markers = snapshot.structure.slice(-10).map((e) => ({
      time: (e.time / 1000) as Time,
      position: e.direction === "bullish" ? "belowBar" : "aboveBar",
      color: e.direction === "bullish" ? "#16c784" : "#ea3943",
      shape: e.direction === "bullish" ? "arrowUp" : "arrowDown",
      text: e.type,
    }));
    // Marker typing across lightweight-charts versions is strict; cast is safe.
    (series as unknown as { setMarkers: (m: unknown[]) => void }).setMarkers(markers);

    // Reset price lines.
    priceLinesRef.current.forEach((pl) => series.removePriceLine(pl));
    priceLinesRef.current = [];

    const addLine = (price: number, color: string, title: string) => {
      priceLinesRef.current.push(
        series.createPriceLine({ price, color, lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title }),
      );
    };

    const pd = snapshot.premiumDiscount;
    if (pd) {
      addLine(pd.equilibrium, "#94a3b8", "EQ");
      addLine(pd.ote.top, "#f59e0b", "OTE");
      addLine(pd.ote.bottom, "#f59e0b", "OTE");
    }

    snapshot.fvgs
      .filter((f) => !f.mitigated)
      .slice(-3)
      .forEach((f) => addLine(f.ce, f.direction === "bullish" ? "#16c784" : "#ea3943", `${f.kind} CE`));
  }, [snapshot]);

  return <div ref={ref} className="h-[440px] w-full" />;
}
