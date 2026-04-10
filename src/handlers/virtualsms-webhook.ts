import { timingSafeEqual } from 'node:crypto';

import type { Config } from '~/lib/config';
import { log } from '~/lib/logger';
import { markProcessed, wasAlreadyProcessed } from '~/utils/dedupe';
import { formatVirtualsmsInbound } from '~/utils/inbound/virtualsms';

import { sendTelegramText } from '~/clients/telegram';
import { virtualsmsWebhookPayloadSchema } from '~/clients/virtualsms';

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return timingSafeEqual(ba, bb);
}

function getProvidedSecret(req: Request, body: Record<string, unknown>): string | undefined {
  const url = new URL(req.url);
  const q = url.searchParams.get('secret') ?? url.searchParams.get('key');
  if (q) return q;

  const auth = req.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }

  const h = req.headers.get('x-virtualsms-secret') ?? req.headers.get('x-webhook-secret');
  if (h) return h.trim();

  const fromBody = body.key ?? body.webhook_secret ?? body.secret;
  if (typeof fromBody === 'string' && fromBody) return fromBody;

  return undefined;
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * VirtualSMS.de / SMS-activation-style inbound webhook: optional shared secret, forward to Telegram.
 */
export async function handleVirtualsmsWebhook(req: Request, cfg: Config): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const rawBody = await req.text();

  const expected = cfg.VIRTUALSMS_WEBHOOK_SECRET?.trim();
  if (expected) {
    let jsonProbe: unknown;
    try {
      jsonProbe = JSON.parse(rawBody) as unknown;
    } catch {
      log.warn('virtualsms invalid JSON body');
      return new Response('Bad Request', { status: 400 });
    }
    const probe = typeof jsonProbe === 'object' && jsonProbe !== null ? jsonProbe : {};
    const provided = getProvidedSecret(req, probe as Record<string, unknown>);
    if (!provided || !constantTimeEqual(provided, expected)) {
      log.warn('virtualsms webhook secret mismatch or missing');
      return new Response('Forbidden', { status: 403 });
    }
  }

  let json: unknown;
  try {
    json = JSON.parse(rawBody) as unknown;
  } catch {
    log.warn('virtualsms invalid JSON body');
    return new Response('Bad Request', { status: 400 });
  }

  const parsed = virtualsmsWebhookPayloadSchema.safeParse(json);
  if (!parsed.success) {
    log.warn('virtualsms payload parse failed', { issues: parsed.error.issues });
    return new Response('Bad Request', { status: 400 });
  }

  const data = parsed.data;
  const eventId =
    data.id !== undefined
      ? `id:${String(data.id)}`
      : data.activationId !== undefined
        ? `activationId:${String(data.activationId)}`
        : data.activation_id !== undefined
          ? `activation_id:${String(data.activation_id)}`
          : `sha256:${await sha256Hex(rawBody)}`;

  if (wasAlreadyProcessed(`virtualsms:${eventId}`)) {
    log.info('duplicate virtualsms webhook ignored', { eventId });
    return new Response('OK', { status: 200 });
  }

  const text = formatVirtualsmsInbound(data);
  const sent = await sendTelegramText(cfg, text);
  if (!sent.ok) {
    return new Response('Telegram error', { status: 502 });
  }

  markProcessed(`virtualsms:${eventId}`);
  log.info('forwarded VirtualSMS inbound to telegram', { eventId });
  return new Response('OK', { status: 200 });
}
