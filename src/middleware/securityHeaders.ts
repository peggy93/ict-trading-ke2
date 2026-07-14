import { NextResponse } from "next/server";

/**
 * Attach a baseline set of security headers to every response. Kept in the
 * `middleware` folder so the edge entrypoint (`src/middleware.ts`) stays thin
 * and the policy is unit-reviewable in isolation.
 */
export function withSecurityHeaders(): NextResponse {
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "on");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}
