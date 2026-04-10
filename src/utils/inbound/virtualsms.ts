import type { VirtualsmsWebhookPayload } from '~/clients/virtualsms';

function joinCodeOrText(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  if (Array.isArray(v)) return v.filter(Boolean).join('\n');
  return v;
}

export function formatVirtualsmsInbound(payload: VirtualsmsWebhookPayload): string {
  const lines: string[] = [];
  lines.push('📩 Inbound SMS (VirtualSMS.de)');

  const activationId = payload.activationId ?? payload.activation_id ?? payload.id ?? undefined;
  if (activationId !== undefined) {
    lines.push(`Activation: ${String(activationId)}`);
  }

  const phone = payload.phoneNumber ?? payload.phone ?? payload.number;
  if (phone) {
    lines.push(`Phone: ${phone}`);
  }

  if (payload.service) {
    lines.push(`Service: ${payload.service}`);
  }
  if (payload.country !== undefined) {
    lines.push(`Country: ${String(payload.country)}`);
  }

  const code = joinCodeOrText(payload.smsCode ?? payload.code);
  if (code) {
    lines.push(`Code: ${code}`);
  }

  const text =
    joinCodeOrText(payload.smsText ?? payload.sms_text) ??
    payload.text ??
    payload.message ??
    payload.body;

  if (text?.trim()) {
    lines.push('');
    lines.push(text.trim());
  } else if (!code) {
    lines.push('');
    lines.push('(no message body)');
  }

  return lines.join('\n');
}
