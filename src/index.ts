import { handleTelnyxWebhook } from './handlers/telnyx-webhook';
import { handleVirtualsmsWebhook } from './handlers/virtualsms-webhook';
import { loadConfig } from './lib/config';
import { log } from './lib/logger';

if (import.meta.main) {
  const cfg = loadConfig();

  const server = Bun.serve({
    port: cfg.PORT,
    routes: {
      '/health': () =>
        new Response(JSON.stringify({ ok: true, service: 'phonehook' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      '/ready': () =>
        new Response(JSON.stringify({ ready: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      '/webhooks/telnyx': (req) => handleTelnyxWebhook(req, cfg),
      '/webhooks/virtualsmsde': (req) => handleVirtualsmsWebhook(req, cfg),
    },
    fetch() {
      return new Response('Not Found', { status: 404 });
    },
  });

  log.info('phonehook listening', {
    port: server.port,
    webhooks: ['/webhooks/telnyx', '/webhooks/virtualsmsde'],
  });
}
