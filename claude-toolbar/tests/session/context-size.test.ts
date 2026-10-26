/**
 * Tests reading the context size from a transcript's end: the last assistant record's input, cache-creation and
 * cache-read tokens added up, skipping the zero records an API error writes, subagent (sidechain) records, other
 * records, a first line cut where the read began, and a text with no size at all.
 */

import { describe, expect, it } from 'vitest';
import { lastContextSize } from '../../src/session/context-size';

/**
 * Writes an assistant record of a transcript.
 * @param input input tokens
 * @param creation cache-creation tokens
 * @param read cache-read tokens
 * @param extra other fields of the record
 * @returns the record as one line
 */
function assistant(input: number, creation: number, read: number, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: 'assistant',
    ...extra,
    message: { usage: { input_tokens: input, cache_creation_input_tokens: creation, cache_read_input_tokens: read, output_tokens: 900 } },
  });
}

describe('lastContextSize', () => {
  it("adds up the last assistant record's input, cache-creation and cache-read tokens", () => {
    const tail = [assistant(10, 20, 30), assistant(3, 1_200, 211_197), JSON.stringify({ type: 'user', message: { content: 'next' } }), ''].join('\n');
    expect(lastContextSize(tail)).toBe(212_400);
  });

  it('skips a zero record written by an API error, and a subagent record', () => {
    const tail = [assistant(3, 1_200, 211_197), assistant(5, 5, 5, { isSidechain: true }), assistant(0, 0, 0, { isApiErrorMessage: true })].join('\n');
    expect(lastContextSize(tail)).toBe(212_400);
  });

  it('skips a first line cut where the read began', () => {
    const line = assistant(1, 2, 3);
    expect(lastContextSize(`${line.slice(line.length / 2)}\n${JSON.stringify({ type: 'user' })}`)).toBeUndefined();
  });

  it('answers undefined when the text holds no size', () => {
    expect([lastContextSize(''), lastContextSize(JSON.stringify({ type: 'user', usage: 'mentioned' }))]).toEqual([undefined, undefined]);
  });
});
