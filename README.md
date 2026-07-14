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

### Detection engine (`src/engine`)
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

### Dashboard (`src/features`)
Live price, order book, market structure, ranked order blocks, fair value gaps, liquidity map,
sessions & kill zones, volume analysis, active signals, watchlist, multi-timeframe bias, REST +
WebSocket status, and performance metrics.

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
