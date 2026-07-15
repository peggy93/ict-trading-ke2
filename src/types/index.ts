// =============================================================================
// Market primitives
// =============================================================================
export type MarketType = "spot" | "perp";

export type Timeframe =
  | "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d" | "1w";

export interface Candle {
  time: number;   // ms epoch (open time)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closed: boolean; // false while the current bar is still forming
}

export interface OrderBookLevel { price: number; size: number; }
export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[]; // descending price
  asks: OrderBookLevel[]; // ascending price
  ts: number;
}

export interface Trade {
  price: number; qty: number; side: "buy" | "sell"; ts: number;
}

// =============================================================================
// Shared enums
// =============================================================================
export type Bias = "bullish" | "bearish" | "neutral";
export type Direction = "bullish" | "bearish";

// =============================================================================
// Market structure
// =============================================================================
export type SwingKind = "high" | "low";

export interface Swing {
  index: number;
  time: number;
  price: number;
  kind: SwingKind;
  /** Fractal strength = number of confirming bars on each side. */
  strength: number;
}

/**
 * Structure classification.
 *  - external: swing (major) structure — the big picture trend.
 *  - internal: sub-structure inside the current external leg.
 */
export type StructureScope = "internal" | "external";

export interface StructureEvent {
  type: "BOS" | "CHoCH" | "MSS";
  scope: StructureScope;
  direction: Direction;
  time: number;
  price: number;       // the level that was broken
  brokenSwing: Swing;
  /** Displacement strength (body/ATR) of the breaking candle. */
  displacement: number;
}

/**
 * A qualified structural high/low.
 *  - strong: swing that was NOT taken before the opposing structure broke
 *            (institutional origin, likely protected).
 *  - weak:   swing that is likely to be run (liquidity).
 * `protected` marks the current higher-low (bullish) / lower-high (bearish)
 * defending the active trend.
 */
export interface StructuralPoint {
  swing: Swing;
  quality: "strong" | "weak";
  protectedPoint: boolean;
}

// =============================================================================
// Liquidity
// =============================================================================
export type LiquidityKind =
  | "BSL" | "SSL"          // buy-side / sell-side liquidity pools
  | "EQH" | "EQL"          // equal highs / equal lows
  | "PDH" | "PDL"          // previous day high / low
  | "PWH" | "PWL"          // previous week high / low
  | "sessionHigh" | "sessionLow";

export type LiquidityQuality = "resting" | "engineered";

export interface LiquidityLevel {
  kind: LiquidityKind;
  side: "buy" | "sell";      // buy-side sits above price, sell-side below
  price: number;
  time: number;
  swept: boolean;
  quality: LiquidityQuality;
  /** Count of touches / equal points forming the pool. */
  strength: number;
}

export type SweepKind = "sweep" | "grab" | "stopHunt";

export interface LiquiditySweep {
  kind: SweepKind;
  direction: Direction;      // bullish = swept lows then reversed up
  price: number;
  time: number;
  index: number;
  /** How far beyond the level price wicked, in ATR multiples. */
  penetrationAtr: number;
  reclaimed: boolean;        // body closed back inside
}

export interface Inducement {
  direction: Direction;      // direction of the expected real move
  price: number;
  time: number;
  index: number;
}

// =============================================================================
// Fair value gaps / imbalance
// =============================================================================
export type FvgKind = "FVG" | "inversion" | "BPR";

export interface FVG {
  kind: FvgKind;
  direction: Direction;
  top: number;
  bottom: number;
  /** Consequent Encroachment — the 50% midpoint of the gap. */
  ce: number;
  time: number;
  index: number;
  mitigated: boolean;
  /** 0..100 quality score (size, volume, context, TF alignment). */
  score: number;
}

// =============================================================================
// Order blocks
// =============================================================================
export type OrderBlockKind =
  | "orderBlock" | "breaker" | "mitigation" | "rejection" | "institutional";

export interface OrderBlock {
  kind: OrderBlockKind;
  direction: Direction;
  top: number;
  bottom: number;
  time: number;
  index: number;
  mitigated: boolean;
  /** 0..100 confidence from displacement, volume, sweep, FVG, structure. */
  confidence: number;
  factors: string[];
}

// =============================================================================
// Premium / discount + fib
// =============================================================================
export interface Zone { top: number; bottom: number; }

export interface FibLevel { ratio: number; price: number; label: string; }

export interface PremiumDiscount {
  equilibrium: number;
  premium: Zone;
  discount: Zone;
  ote: Zone;                 // 0.62–0.79 retracement band
  rangeHigh: number;
  rangeLow: number;
  direction: Direction;      // impulse direction anchoring the fib
  retracement: FibLevel[];
  expansion: FibLevel[];
}

// =============================================================================
// Sessions
// =============================================================================
export type SessionName = "Asia" | "London" | "NewYork";
export type KillzoneName =
  | "AsianKillzone" | "LondonOpen" | "NewYorkOpen" | "LondonClose";

export interface SessionInfo {
  name: SessionName;
  active: boolean;
  killzone: boolean;
  opensInMs: number;
  closesInMs: number;
  high?: number;
  low?: number;
}

export interface KillzoneInfo {
  name: KillzoneName;
  active: boolean;
  startsInMs: number;
  endsInMs: number;
}

// =============================================================================
// Volume intelligence
// =============================================================================
export interface VolumeProfile {
  last: number;
  average: number;
  relative: number;          // last / average
  spike: boolean;
  delta: number;             // -1..1 buy/sell pressure proxy
  cumulativeDelta: number;
  imbalance: number;         // -1..1 recent buy vs sell imbalance
}

// =============================================================================
// Displacement
// =============================================================================
export interface DisplacementCandle {
  index: number;
  time: number;
  direction: Direction;
  bodyAtr: number;
  institutional: boolean;
}

// =============================================================================
// Aggregated ICT snapshot (per timeframe)
// =============================================================================
export interface IctSnapshot {
  timeframe: Timeframe;
  bias: Bias;
  swings: Swing[];
  structuralPoints: StructuralPoint[];
  structure: StructureEvent[];
  fvgs: FVG[];
  orderBlocks: OrderBlock[];
  liquidity: LiquidityLevel[];
  sweeps: LiquiditySweep[];
  inducements: Inducement[];
  premiumDiscount: PremiumDiscount | null;
  displacement: DisplacementCandle[];
  volume: VolumeProfile | null;
}

// =============================================================================
// Confidence + signals
// =============================================================================
export type ConfluenceFactor =
  | "marketStructure" | "liquidity" | "orderBlock" | "fvg"
  | "volume" | "session" | "trend";

export interface ConfluenceScore {
  factor: ConfluenceFactor;
  weight: number;   // 0..1 weight of this factor
  score: number;    // 0..1 how well it is satisfied
  detail: string;
}

export interface FilterResult { name: string; passed: boolean; detail: string; weight: number; }

export interface Signal {
  id: string;
  symbol: string;
  market: MarketType;
  side: "BUY" | "SELL";
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskReward: number;
  confidence: number;   // 0..100
  confluence: ConfluenceScore[];
  reasons: string[];
  timeframe: Timeframe;
  htfBias: Bias;
  createdAt: number;
}

// =============================================================================
// Watchlist / metrics
// =============================================================================
export interface WatchlistItem {
  symbol: string;
  market: MarketType;
  bias: Bias;
  lastPrice: number;
  lastSignal?: Signal;
}

export interface PerformanceMetrics {
  signalsGenerated: number;
  avgConfidence: number;
  avgRiskReward: number;
  buyCount: number;
  sellCount: number;
  lastUpdated: number;
}


// =============================================================================
// Paper trading / analytics (derived from signals; not part of the strategy)
// =============================================================================
export type TradeStatus = "open" | "win" | "loss" | "breakeven";
export type TradeExitReason = "TP" | "SL" | "BE" | "manual";

export interface PaperTrade {
  id: string;
  signalId: string;
  symbol: string;
  market: MarketType;
  timeframe: Timeframe;
  side: "BUY" | "SELL";
  entry: number;
  stopLoss: number;
  takeProfit: number;      // primary target (TP2) used for settlement
  riskReward: number;
  confidence: number;
  openedAt: number;
  status: TradeStatus;
  closedAt?: number;
  exitPrice?: number;
  rMultiple?: number;      // realized reward in R multiples
  reason?: TradeExitReason;
}

export interface EquityPoint {
  t: number;
  equityR: number;         // cumulative realized R after this trade
}

export interface PeriodPerformance {
  key: string;             // e.g. "2026-07" or "2026-07-14"
  netR: number;
  trades: number;
  wins: number;
}

export interface PerformanceReport {
  totalTrades: number;
  openTrades: number;
  closedTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;         // 0..100 over closed decisive trades
  profitFactor: number;    // gross win R / gross loss R (Infinity if no losses)
  netR: number;            // total realized R
  maxDrawdownR: number;
  avgRiskReward: number;   // mean planned RR of closed trades
  avgWinR: number;
  avgLossR: number;
  expectancyR: number;     // mean R per closed trade
  equityCurve: EquityPoint[];
  daily: PeriodPerformance[];
  monthly: PeriodPerformance[];
}

// =============================================================================
// Backtesting
// =============================================================================
export interface BacktestParams {
  minConfidence: number;
  minConfirmations: number;
  /** Warmup bars before signals may fire. */
  warmup: number;
}

export interface BacktestResult {
  symbol: string;
  market: MarketType;
  timeframe: Timeframe;
  params: BacktestParams;
  fromTime: number;
  toTime: number;
  candlesTested: number;
  trades: PaperTrade[];
  report: PerformanceReport;
}
