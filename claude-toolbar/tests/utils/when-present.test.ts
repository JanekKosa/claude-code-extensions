/**
 * Tests whenPresent: a read's result, the fallback for a missing file, and any other error thrown.
 */

import { describe, expect, it } from 'vitest';
import { whenPresent } from '../../src/utils/when-present';

/**
 * Builds a file system error with a code.
 * @param code the code, such as ENOENT
 * @returns the error
 */
function fileError(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`${code}: failed`), { code });
}

describe('whenPresent', () => {
  it("answers the read's result, or the fallback when the file is missing", () => {
    expect([
      whenPresent('fallback', () => 'read'),
      whenPresent('fallback', () => {
        throw fileError('ENOENT');
      }),
    ]).toEqual(['read', 'fallback']);
  });

  it('throws any other error', () => {
    expect(() =>
      whenPresent('fallback', () => {
        throw fileError('EACCES');
      }),
    ).toThrow('EACCES: failed');
  });
});
