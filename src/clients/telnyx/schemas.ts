import { z } from 'zod';

/** Top-level Telnyx messaging webhook envelope. */
export const telnyxWebhookEnvelopeSchema = z.object({
  data: z.object({
    event_type: z.string(),
    id: z.string().min(1),
    occurred_at: z.string(),
    payload: z.record(z.string(), z.any()),
    record_type: z.literal('event'),
  }),
  meta: z
    .object({
      attempt: z.number().optional(),
      delivered_to: z.string().optional(),
    })
    .optional(),
});

export type TelnyxWebhookEnvelope = z.infer<typeof telnyxWebhookEnvelopeSchema>;

const phoneEndpointSchema = z.object({
  phone_number: z.string(),
  carrier: z.string().optional(),
  line_type: z.string().optional(),
  status: z.string().optional(),
});

/** Payload inside `data.payload` for inbound SMS/MMS. */
export const messageReceivedPayloadSchema = z.object({
  id: z.string().min(1),
  record_type: z.literal('message'),
  direction: z.literal('inbound'),
  type: z.enum(['SMS', 'MMS']),
  text: z.string().nullable().optional(),
  from: phoneEndpointSchema,
  to: z.array(phoneEndpointSchema),
  media: z
    .array(
      z.object({
        url: z.string(),
        content_type: z.string().optional(),
        size: z.number().optional(),
      })
    )
    .optional(),
  messaging_profile_id: z.string().optional(),
});

export type MessageReceivedPayload = z.infer<typeof messageReceivedPayloadSchema>;
