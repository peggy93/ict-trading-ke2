# ICT / SMC Trading Platform

A production-grade **Smart Money Concepts (SMC) / Inner Circle Trader (ICT)** market-analysis
platform built with **Next.js 15 (App Router)**, **TypeScript (strict)**, **Tailwind CSS v4**,
**Zustand**, **TanStack Query** and **lightweight-charts**. It streams live market data from the
**BingX REST + WebSocket APIs** for Spot and USDT-M Perpetuals, runs a modular multi-timeframe
detection engine, and emits scored BUY/SELL setups with a full risk plan.

> **Disclaimer:** Educational software. ICT/SMC signals are heuristic and **not financial advice**.
> Paper trade first. Use **read-only** API keys.

---

## Features

### Detection engine (`src/lib/engine`)
- **Market structure** — BOS, CHoCH, MSS, internal vs external structure, swing highs/lows,
  strong/weak points and protected highs/lows, with close-through + displacement noise filtering.
- **Liquidity** — buy/sell-side liquidity (BSL/SSL), equal highs/lows, resting vs engineered pools,
  liquidity sweeps / grabs / stop hunts, inducement, and PDH/PDL/PWH/PWL references.
- **Fair value gaps** — bullish/bearish FVGs, Consequent Encroachment (CE), inversion FVGs and
  Balanced Price Ranges (BPR), each scored on size + volume.
- **Order blocks** — order block / breaker / mitigation / rejection / institutional, each ranked
  0–100 by displacement, volume, sweep confluence, FVG confluence and structure confirmation.
- **Premium/discount** — equilibrium, premium & discount zones, OTE band, Fibonacci retracement
  and expansion.
- **Sessions** — Asia / London / New York with ICT kill zones (Asian KZ, London Open, NY Open,
  London Close) and Asian-range session bias.
- **Volume intelligence** — relative volume, spike detection, delta proxy, cumulative delta and
  imbalance.
- **Confidence engine** — weighted confluence model (structure 20% · liquidity 20% · order block
  15% · FVG 15% · volume 10% · session 10% · trend 10%) producing a 0–100 score.
- **Signal generator** — multi-confirmation gating; every signal includes side, entry, SL,
  TP1/TP2/TP3, R:R, confidence, weighted confluence breakdown and human-readable reasons.
- **Multi-timeframe** — 1m, 3m, 5m, 15m, 30m, 1h, 4h, 1D, 1W analyzed simultaneously with an HTF
  bias cascade that influences lower-timeframe signals.

### Dashboard (`src/components`)
A premium, responsive, TradingView/Bloomberg-style dashboard with **dark & light themes** and six
views (see the **Dashboard Guide** below): Live, Analytics, Risk, Alerts, Backtest and Settings.

### Alerts
Browser notifications, sound, plus optional server-relayed Telegram & Discord alerts (tokens stay
server-side).

---

## Architecture

```
.
├── public/                 # Static assets served at the web root (favicon)
└── src/
    ├── app/                # Next.js App Router (routes, API proxy, alert relay)
    ├── assets/             # In-bundle assets (SVG logo component)
    ├── components/         # All reusable UI, grouped by domain
    │   ├── ui/             # Presentational primitives
    │   ├── dashboard/ chart/ orderbook/ structure/ signals/
    │   └── sessions/ volume/ watchlist/ metrics/ status/ settings/
    ├── config/             # Tunable engine config (thresholds, confluence weights)
    ├── constants/          # Static domain constants (timeframes, sessions, fib)
    ├── hooks/              # React hooks (websocket, candles, ict, signals, orderbook)
    ├── lib/                # Shared libraries
    │   ├── utils.ts        # Low-level helpers
    │   └── engine/         # Pure SMC/ICT detection engine
    │       ├── indicators/ marketStructure/ liquidity/ fvg/
    │       ├── orderBlocks/ zones/ sessions/ displacement/
    │       └── signals/    # confidence · filters · risk · signalEngine
    ├── middleware/         # Edge middleware logic (security headers)
    ├── middleware.ts       # Next.js middleware entrypoint
    ├── providers/          # React context providers (TanStack Query)
    ├── services/           # External integrations (BingX REST/WS, alerts)
    ├── store/              # Zustand stores (market, settings, watchlist)
    ├── styles/             # Global stylesheet
    ├── types/              # Shared TypeScript types
    └── utils/              # Domain math/format helpers
```

The engine (`src/lib/engine`) is **pure and framework-free**, so it is unit-testable and reusable
for future backtesting, paper trading, or a worker thread.

> **Note on `context/`:** application state is handled by **Zustand stores** (`src/store`) plus the
> composition root in `src/providers`, so a separate React `context/` layer would be redundant and
> was intentionally omitted to avoid dead code.

---

## Getting started

### Prerequisites
- Node.js 20+ (tested on Node 22)

### Installation
```bash
npm install
cp .env.example .env.local   # optional: add server-side keys
```

### Development
```bash
npm run dev
# open http://localhost:3000, click "Settings", paste a READ-ONLY BingX key
```

### Production build
```bash
npm run build
npm start
```

### Quality gates
```bash
npm run typecheck   # strict TypeScript
npm run lint        # ESLint (next/core-web-vitals + next/typescript)
npm test            # Vitest unit tests for the detection engines
npm run format      # Prettier
```

---

## Environment variables (`.env.local`)

| Variable | Purpose |
| --- | --- |
| `BINGX_API_KEY` | BingX API key (server-side fallback) |
| `BINGX_API_SECRET` | BingX API secret (server-side only, never exposed) |
| `BINGX_REST_BASE` | REST base URL (defaults to `https://open-api.bingx.com`) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Optional Telegram alert relay |
| `DISCORD_WEBHOOK_URL` | Optional Discord alert relay |

All secrets live server-side in the REST proxy (`/api/bingx/*`) and alert relay (`/api/alerts`).
A per-user secret entered in the UI is kept in memory only and never persisted.

---

## Deployment

Deploy to any Node host or **Vercel**:

1. Push this repository to GitHub (already configured).
2. Import the repo on [Vercel](https://vercel.com/new) (framework auto-detected as Next.js).
3. Add the environment variables above in the project settings.
4. Deploy. The BingX proxy and alert relay run as Node serverless functions.

For a self-hosted deployment: `npm run build && npm start` behind a reverse proxy.

---

## Roadmap-ready extensions
Automated/paper trading, backtesting, trade journal, AI signal re-ranking, portfolio management,
multi-exchange adapters (Binance/Bybit/OKX/MEXC) and email notifications all slot into the existing
modular boundaries without touching the core engine.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | Strict TS check |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run format` | Prettier write |


---

# Dashboard Guide

The dashboard is a client-rendered app shell (`src/components/dashboard/DashboardShell.tsx`) that
owns the live data pipeline **once** and routes between six views. The strategy engine
(`src/lib/engine`) is consumed read-only — the dashboard never alters detection logic.

## Installation

```bash
git clone https://github.com/peggy93/ict-trading-ke2.git
cd ict-trading-ke2
npm install
cp .env.example .env.local     # optional; public market data works without keys
npm run dev                    # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

## Configuration

| Where | What |
| --- | --- |
| **Top bar** | Market (Spot / USDT-M Perp), symbol, and chart timeframe. |
| **API Keys dialog** | BingX read-only key/secret (kept in memory, sent per-request to the signed proxy). |
| **Settings view** | Theme (dark/light), accent color, indicator/panel visibility, default timeframe, min confidence & confirmations, and named presets. |
| **Risk view** | Account equity, sizing mode, risk %, guardrails, break-even/trailing/partial-TP. |
| **Alerts view** | Delivery channels and per-event triggers. |
| **`.env.local`** | Server-side secrets: `BINGX_API_KEY/SECRET`, `TELEGRAM_BOT_TOKEN/CHAT_ID`, `DISCORD_WEBHOOK_URL`. |

Preferences persist to `localStorage` (theme, UI, risk, alerts, presets, watchlist). The API
secret is **never** persisted.

## Views

- **Live** — Real-time market read-out: price + HTF bias cascade, candlestick chart with structure
  markers and EQ/OTE/FVG price lines, current-trade card (entry/SL/TP1–3, R:R, live-R, position
  status), premium/discount meter, multi-timeframe grid, market structure (BOS/CHoCH/MSS), ranked
  order blocks, fair value gaps, liquidity map, sessions & kill zones, volume, signals, order book
  and watchlist. Every panel can be toggled in Settings.
- **Analytics** — Live paper-trading performance: win rate, net P/L (R), profit factor, max
  drawdown, avg R:R, expectancy, equity curve, monthly/daily breakdown and full trade history.
  Export to CSV. Signals are auto-tracked and settled against streaming candles.
- **Risk** — Position-sizing calculator and risk guardrails (see table above), with a live sizing
  preview from the latest signal.
- **Alerts** — Channels (browser, sound, Telegram, Discord; email/push are configuration
  placeholders) and per-event triggers (signals, BOS, CHoCH, OB, FVG, sweep, session). "Send test"
  verifies your setup.
- **Backtest** — Replays the **exact** production engine bar-by-bar over historical klines and
  reports win rate, net R, profit factor, drawdown, expectancy, equity curve and trades. Export to
  CSV. Tunable min-confidence / confirmations / warmup.
- **Settings** — Customization and presets (above).

## Architecture notes

- **State:** Zustand stores (`src/store`) for market data, settings, watchlist, UI, risk,
  analytics and presets; React Context (`src/context`) for theme.
- **Analytics & backtest** live in `src/lib/analytics` and `src/lib/backtest` — pure functions that
  wrap strategy output; they contain **no** detection logic.
- **Performance:** the data pipeline runs once in the shell; panels subscribe to narrow store
  slices; the chart updates imperatively; heavy analysis is memoized by candle counts.

## Known limitations (transparency)

- **Paper only:** there is no broker/order execution. Analytics & backtests are simulations of the
  signals; trade management options (break-even, trailing, partial TP) configure the model and
  sizing, and full execution modelling is a future enhancement.
- **Backtest HTF bias** is approximated from the tested timeframe (a single kline series is
  fetched), so live multi-timeframe confluence may differ.
- **Email & push** alerts are wired as configuration only — enabling them requires an SMTP provider
  in `/api/alerts` and a service worker + VAPID keys respectively.
- **PDF export / trade replay / parameter-sweep optimization** are not yet implemented (CSV export
  is available for trades and backtests).
