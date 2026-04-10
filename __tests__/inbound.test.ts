import { expect, test } from 'bun:test';

import { formatInboundMessage } from '~/utils/inbound';

import type { MessageReceivedPayload } from '~/clients/telnyx/schemas';

test('formatInboundMessage includes from, to, and body', () => {
  const payload: MessageReceivedPayload = {
    id: 'msg-1',
    record_type: 'message',
    direction: 'inbound',
    type: 'SMS',
    text: 'Hello world',
    from: { phone_number: '+15550001' },
    to: [{ phone_number: '+15550002' }],
  };
  const out = formatInboundMessage(payload);
  expect(out).toContain('+15550001');
  expect(out).toContain('+15550002');
  expect(out).toContain('Hello world');
  expect(out).toContain('msg-1');
});
