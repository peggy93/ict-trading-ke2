import crypto from "node:crypto";

/**
 * BingX signing: build the canonical query string in the SAME order the
 * request will send it, HMAC-SHA256 it with the secret, and append as
 * `signature`. `timestamp` (ms) is required on signed endpoints.
 *
 * Server-only — never import this into client code.
 */
export function signQuery(
  params: Record<string, string | number>,
  secret: string,
): string {
  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const signature = crypto.createHmac("sha256", secret).update(query).digest("hex");
  return `${query}&signature=${signature}`;
}
