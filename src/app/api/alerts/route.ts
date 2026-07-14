import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface AlertPayload {
  channels?: { telegram?: boolean; discord?: boolean };
  title?: string;
  body?: string;
}

/**
 * Server-side relay for optional alert channels. Secrets come from env only,
 * so they are never exposed to the browser. Each channel fails independently.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: AlertPayload;
  try {
    payload = (await req.json()) as AlertPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { channels, title = "", body = "" } = payload;
  const text = `🔔 ${title}\n${body}`;
  const results: Record<string, string> = {};

  if (channels?.telegram) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    if (token && chat) {
      try {
        const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: chat, text }),
        });
        results.telegram = r.ok ? "sent" : `error ${r.status}`;
      } catch (e) {
        results.telegram = `error ${String(e)}`;
      }
    } else {
      results.telegram = "not configured";
    }
  }

  if (channels?.discord) {
    const url = process.env.DISCORD_WEBHOOK_URL;
    if (url) {
      try {
        const r = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: text }),
        });
        results.discord = r.ok ? "sent" : `error ${r.status}`;
      } catch (e) {
        results.discord = `error ${String(e)}`;
      }
    } else {
      results.discord = "not configured";
    }
  }

  return NextResponse.json({ ok: true, results });
}
