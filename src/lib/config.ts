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
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(): Config {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${msg}`);
  }
  const cfg = parsed.data;
  if (!cfg.SKIP_SIGNATURE_VERIFICATION && !cfg.TELNYX_PUBLIC_KEY) {
    throw new Error(
      'Set TELNYX_PUBLIC_KEY (recommended for production) or SKIP_SIGNATURE_VERIFICATION=true only for local dev'
    );
  }
  return cfg;
}
