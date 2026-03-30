import type { MessageReceivedPayload } from "../../clients/telnyx/schemas";

export function formatInboundSmsForTelegram(payload: MessageReceivedPayload): string {
  const lines: string[] = [];
  lines.push("📩 Inbound SMS (Telnyx)");
  lines.push(`From: ${payload.from.phone_number}`);
  const toNums = payload.to.map((t) => t.phone_number).join(", ");
  lines.push(`To: ${toNums}`);
  lines.push(`Type: ${payload.type}`);
  if (payload.messaging_profile_id) {
    lines.push(`Messaging profile: ${payload.messaging_profile_id}`);
  }
  const body = (payload.text ?? "").trim();
  if (body) {
    lines.push("");
    lines.push(body);
  } else {
    lines.push("");
    lines.push("(no text body)");
  }
  if (payload.media?.length) {
    lines.push("");
    lines.push("Media:");
    for (const m of payload.media) {
      lines.push(`- ${m.content_type ?? "file"}: ${m.url}`);
    }
  }
  lines.push("");
  lines.push(`Telnyx message id: ${payload.id}`);
  return lines.join("\n");
}
