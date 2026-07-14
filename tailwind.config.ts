import type { Config } from "tailwindcss";

/**
 * Tailwind v4 is primarily CSS-first (config lives in globals.css via
 * `@import "tailwindcss"`). This file is kept minimal for tooling that still
 * expects a config module and to declare content globs explicitly.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
};

export default config;
