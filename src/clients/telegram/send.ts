import { log } from "~/lib/logger";
import type { Config } from "~/lib/config";

const TELEGRAM_MAX = 4096;

const tgApi = (token: string, method: string) =>
  `https://api.telegram.org/bot${encodeURIComponent(token)}/${method}`;

export type SendResult = { ok: true } | { ok: false; status: number; body: string };

/**
 * Sends plain text to Telegram. Content is truncated to API limits.
 * No parse_mode — avoids HTML/Markdown injection from SMS content.
 */
export async function sendTelegramText(cfg: Config, text: string): Promise<SendResult> {
  const chunk = text.length > TELEGRAM_MAX ? `${text.slice(0, TELEGRAM_MAX - 20)}\n…(truncated)` : text;

  const body = new URLSearchParams({
    chat_id: cfg.TELEGRAM_CHAT_ID,
    text: chunk,
    disable_web_page_preview: "true",
  });

  let res: Response;
  try {
    res = await fetch(tgApi(cfg.TELEGRAM_BOT_TOKEN, "sendMessage"), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (e) {
    log.error("telegram sendMessage network error", { err: String(e) });
    return { ok: false, status: 0, body: String(e) };
  }

  const responseText = await res.text();
  if (!res.ok) {
    log.error("telegram sendMessage failed", { status: res.status, body: responseText.slice(0, 500) });
    return { ok: false, status: res.status, body: responseText };
  }

  return { ok: true };
}
