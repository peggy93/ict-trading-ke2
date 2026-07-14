export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export const round = (n: number, dp = 2) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

/** Infer sensible price precision from a reference price. */
export const pricePrecision = (p: number) =>
  p >= 1000 ? 1 : p >= 1 ? 2 : p >= 0.01 ? 5 : 8;

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");
