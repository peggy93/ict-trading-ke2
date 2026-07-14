import { NextRequest, NextResponse } from "next/server";
import { signQuery } from "@/services/bingx/sign";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE = process.env.BINGX_REST_BASE ?? "https://open-api.bingx.com";

/**
 * Transparent proxy so the API secret never reaches the browser.
 * - Public market-data calls pass through unsigned.
 * - When `?__signed=1`, we inject timestamp + HMAC signature server-side.
 * - Per-user keys may be supplied via `x-bingx-key` / `x-bingx-secret`
 *   headers (falling back to env). Prefer READ-ONLY keys.
 */
async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  const url = new URL(req.url);
  const signed = url.searchParams.get("__signed") === "1";
  url.searchParams.delete("__signed");

  const key = req.headers.get("x-bingx-key") ?? process.env.BINGX_API_KEY ?? "";
  const secret = req.headers.get("x-bingx-secret") ?? process.env.BINGX_API_SECRET ?? "";

  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (params[k] = v));

  let qs = url.searchParams.toString();
  if (signed) {
    if (!secret) {
      return NextResponse.json({ error: "Missing API secret" }, { status: 401 });
    }
    params.timestamp = String(Date.now());
    qs = signQuery(params, secret);
  }

  const target = `${BASE}/${path.join("/")}${qs ? `?${qs}` : ""}`;
  try {
    const res = await fetch(target, {
      method: req.method,
      headers: key ? { "X-BX-APIKEY": key } : undefined,
      cache: "no-store",
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Upstream BingX request failed", detail: String(err) },
      { status: 502 },
    );
  }
}

export { handler as GET, handler as POST };
