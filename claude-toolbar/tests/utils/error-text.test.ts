/**
 * Tests errorText: an Error's message, and anything else thrown as text.
 */

import { describe, expect, it } from 'vitest';
import { errorText } from '../../src/utils/error-text';

describe('errorText', () => {
  it("gives an Error's message", () => {
    expect(errorText(new Error('disk full'))).toBe('disk full');
  });

  it('gives anything else as text', () => {
    expect([errorText('plain words'), errorText(42), errorText(undefined)]).toEqual(['plain words', '42', 'undefined']);
  });
});
