/**
 * Tests the nonces: 16 random bytes in base64, a new one each time.
 */

import { describe, expect, it } from 'vitest';
import { randomNonce } from '../../src/utils/nonce';

describe('randomNonce', () => {
  it('gives 16 bytes in base64, different each time', () => {
    const nonces = Array.from({ length: 20 }, () => randomNonce());
    expect([nonces.every((nonce) => Buffer.from(nonce, 'base64').length === 16 && /^[A-Za-z0-9+/]{22}==$/.test(nonce)), new Set(nonces).size]).toEqual([true, 20]);
  });
});
