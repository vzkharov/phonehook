import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_CHAT_ID: z.string().min(1),
  TELNYX_PUBLIC_KEY: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : undefined)),
  SKIP_SIGNATURE_VERIFICATION: z
    .string()
    .optional()
    .transform((v) => v === 'true' || v === '1'),
  VIRTUALSMS_WEBHOOK_SECRET: z
    .string()
    .optional()
    .transform((s) => (s?.trim() ? s.trim() : undefined)),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${msg}`);
  }
  const cfg = parsed.data;
  const telnyxReady = Boolean(cfg.TELNYX_PUBLIC_KEY) || cfg.SKIP_SIGNATURE_VERIFICATION;
  const virtualsmsReady = Boolean(cfg.VIRTUALSMS_WEBHOOK_SECRET);
  if (!telnyxReady && !virtualsmsReady) {
    throw new Error(
      'Set TELNYX_PUBLIC_KEY or SKIP_SIGNATURE_VERIFICATION=true for Telnyx, or set VIRTUALSMS_WEBHOOK_SECRET for VirtualSMS.de webhooks.'
    );
  }
  return cfg;
}
