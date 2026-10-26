/**
 * Nonces: random values a page's content security policy names, so that only the page's own script tags run.
 * Knows nothing of the toolbar.
 */

import { randomBytes } from 'node:crypto';

/** How many random bytes a nonce holds: 16, the 128 bits the CSP specification asks for at least. */
const nonceBytes = 16;

/**
 * Makes a fresh nonce.
 * @returns 16 random bytes, in base64
 */
export function randomNonce(): string {
  return randomBytes(nonceBytes).toString('base64');
}
