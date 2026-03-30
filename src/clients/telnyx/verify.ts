import { log } from "~/lib/logger";
import type { Config } from "~/lib/config";

const MAX_SKEW_SEC = 300;

function parseTimestampSec(ts: string): number | null {
  const n = Number.parseInt(ts, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Verifies Telnyx Ed25519 signature over `{timestamp}|{rawBody}`.
 * Uses Web Crypto (works with Telnyx’s base64 raw 32-byte public key).
 * @see https://developers.telnyx.com/docs/messaging/messages/receiving-webhooks/index
 */
export async function verifyTelnyxWebhook(
  cfg: Config,
  rawBody: string,
  signatureB64: string | undefined,
  timestampHeader: string | undefined,
): Promise<boolean> {
  if (cfg.SKIP_SIGNATURE_VERIFICATION) {
    log.warn("webhook signature verification skipped (SKIP_SIGNATURE_VERIFICATION)");
    return true;
  }
  const publicKeyB64 = cfg.TELNYX_PUBLIC_KEY;
  if (!publicKeyB64 || !signatureB64 || !timestampHeader) {
    return false;
  }

  const tsSec = parseTimestampSec(timestampHeader);
  if (tsSec === null) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - tsSec) > MAX_SKEW_SEC) {
    log.warn("telnyx timestamp outside allowed skew", { skewSec: Math.abs(nowSec - tsSec) });
    return false;
  }

  let publicKeyBytes: Buffer;
  try {
    publicKeyBytes = Buffer.from(publicKeyB64, "base64");
  } catch {
    return false;
  }
  if (publicKeyBytes.length !== 32) {
    log.error("TELNYX_PUBLIC_KEY must decode to 32 bytes (raw Ed25519 public key)");
    return false;
  }

  let sig: Buffer;
  try {
    sig = Buffer.from(signatureB64, "base64");
  } catch {
    return false;
  }

  const signedPayload = new TextEncoder().encode(`${timestampHeader}|${rawBody}`);

  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"],
    );
  } catch (e) {
    log.error("failed to import Ed25519 public key", { err: String(e) });
    return false;
  }

  try {
    return await crypto.subtle.verify({ name: "Ed25519" }, cryptoKey, sig, signedPayload);
  } catch (e) {
    log.error("signature verify threw", { err: String(e) });
    return false;
  }
}
