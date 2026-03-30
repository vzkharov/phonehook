/**
 * In-memory idempotency for Telnyx webhook retries after successful processing.
 * Not suitable for multi-instance deploys without a shared store.
 */
const TTL_MS = 48 * 60 * 60 * 1000;
const seen = new Map<string, number>();

function prune(now: number) {
  for (const [id, exp] of seen) {
    if (exp < now) seen.delete(id);
  }
}

export function wasAlreadyProcessed(eventId: string): boolean {
  const now = Date.now();
  prune(now);
  return seen.has(eventId);
}

export function markProcessed(eventId: string) {
  const now = Date.now();
  prune(now);
  seen.set(eventId, now + TTL_MS);
}
