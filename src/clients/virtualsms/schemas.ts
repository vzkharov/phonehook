import { z } from 'zod';

/**
 * VirtualSMS.de uses an SMS-activation-style API; webhook payloads are not fully
 * documented publicly. This schema accepts common field aliases from compatible providers.
 */
export const virtualsmsWebhookPayloadSchema = z
  .object({
    id: z.union([z.number(), z.string()]).optional(),
    activationId: z.union([z.number(), z.string()]).optional(),
    activation_id: z.union([z.number(), z.string()]).optional(),
    smsCode: z.union([z.string(), z.array(z.string())]).optional(),
    code: z.union([z.string(), z.array(z.string())]).optional(),
    smsText: z.union([z.string(), z.array(z.string())]).optional(),
    sms_text: z.union([z.string(), z.array(z.string())]).optional(),
    text: z.string().optional(),
    message: z.string().optional(),
    body: z.string().optional(),
    phoneNumber: z.string().optional(),
    phone: z.string().optional(),
    number: z.string().optional(),
    service: z.string().optional(),
    country: z.union([z.number(), z.string()]).optional(),
  })
  .passthrough();

export type VirtualsmsWebhookPayload = z.infer<typeof virtualsmsWebhookPayloadSchema>;
