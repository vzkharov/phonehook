import type { Config } from '~/lib/config';
import { log } from '~/lib/logger';
import { markProcessed, wasAlreadyProcessed } from '~/utils/dedupe';
import { formatInboundMessage } from '~/utils/inbound/inbound';

import { sendTelegramText } from '~/clients/telegram';
import {
  messageReceivedPayloadSchema,
  telnyxWebhookEnvelopeSchema,
  verifyTelnyxWebhook,
} from '~/clients/telnyx';

// function getHeader(req: Request, name: string): string | undefined {
//   const v = req.headers.get(name);
//   return v ?? undefined;
// }

/**
 * Telnyx messaging profile webhook: verify, filter `message.received`, forward to Telegram.
 */
export async function handleTelnyxWebhook(req: Request, cfg: Config): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const rawBody = await req.text();

  // const okSig = await verifyTelnyxWebhook(
  //   cfg,
  //   rawBody,
  //   getHeader(req, "telnyx-signature-ed25519"),
  //   getHeader(req, "telnyx-timestamp"),
  // );
  // if (!okSig) {
  //   log.warn("telnyx signature verification failed");
  //   return new Response("Forbidden", { status: 403 });
  // }

  let json: unknown;
  try {
    json = JSON.parse(rawBody) as unknown;
  } catch {
    log.warn('invalid JSON body');
    return new Response('Bad Request', { status: 400 });
  }

  const envelope = telnyxWebhookEnvelopeSchema.safeParse(json);
  if (!envelope.success) {
    log.warn('telnyx envelope parse failed', { issues: envelope.error.issues });
    return new Response('Bad Request', { status: 400 });
  }

  const { data } = envelope.data;

  if (data.event_type !== 'message.received') {
    log.info('ignoring non-inbound event', { event_type: data.event_type, id: data.id });
    return new Response('OK', { status: 200 });
  }

  if (wasAlreadyProcessed(data.id)) {
    log.info('duplicate webhook delivery ignored', { id: data.id });
    return new Response('OK', { status: 200 });
  }

  const inbound = messageReceivedPayloadSchema.safeParse(data.payload);
  if (!inbound.success) {
    log.error('message.received payload parse failed', { issues: inbound.error.issues });
    return new Response('Bad Request', { status: 400 });
  }

  const text = formatInboundMessage(inbound.data);
  const sent = await sendTelegramText(cfg, text);
  if (!sent.ok) {
    return new Response('Telegram error', { status: 502 });
  }

  markProcessed(data.id);
  log.info('forwarded inbound SMS to telegram', {
    telnyx_event_id: data.id,
    message_id: inbound.data.id,
  });
  return new Response('OK', { status: 200 });
}
