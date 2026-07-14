import { withSecurityHeaders } from "@/middleware/securityHeaders";

/** Next.js edge middleware entrypoint. */
export function middleware() {
  return withSecurityHeaders();
}

export const config = {
  // Run on all routes except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"],
};
