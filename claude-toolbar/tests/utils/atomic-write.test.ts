/**
 * Tests the atomic write on Node's real file system, in a temporary folder: a new file in a missing folder, a file
 * replaced, UTF-8 without a byte-order mark, a rename retried while the file is held, the tries running out, another
 * error failing at once, and no temporary file left behind.
 */

import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { atomicWrite, type Rename } from '../../src/utils/atomic-write';

const retry = { attempts: 3, delayMs: 1 };

/**
 * Makes a rename that fails a number of times before it renames, counting every try.
 * @param failures how many tries fail
 * @param code the error code they fail with
 * @returns the rename, and the count of tries so far
 */
function failingRename(failures: number, code: string): { rename: Rename; tries(): number } {
  let tries = 0;
  return {
    rename: async (from, to) => {
      tries++;
      if (tries <= failures) throw Object.assign(new Error(`${code}: held`), { code });
      await rename(from, to);
    },
    tries: () => tries,
  };
}

describe('atomicWrite', () => {
  let folder: string;
  let file: string;

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'claude-toolbar-atomic-'));
    file = join(folder, 'state.json');
  });

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  it('creates the folder when missing, and leaves only the file there', async () => {
    const nested = join(folder, 'one', 'two', 'state.json');
    await atomicWrite(nested, 'text', retry);
    expect([readFileSync(nested, 'utf8'), readdirSync(join(folder, 'one', 'two'))]).toEqual(['text', ['state.json']]);
  });

  it('replaces a file, as UTF-8 without a byte-order mark', async () => {
    writeFileSync(file, 'old');
    await atomicWrite(file, 'é', retry);
    expect([...readFileSync(file)]).toEqual([0xc3, 0xa9]);
  });

  it.each(['EPERM', 'EBUSY', 'EACCES'])('tries the rename again on %s, and the file gets the text', async (code) => {
    const held = failingRename(2, code);
    await atomicWrite(file, 'text', retry, held.rename);
    expect([held.tries(), readFileSync(file, 'utf8'), readdirSync(folder)]).toEqual([3, 'text', ['state.json']]);
  });

  it('rejects when the file stays held, keeps the old text and leaves no temporary file', async () => {
    writeFileSync(file, 'old');
    const held = failingRename(3, 'EBUSY');
    await expect(atomicWrite(file, 'text', retry, held.rename)).rejects.toThrow('EBUSY: held');
    expect([held.tries(), readFileSync(file, 'utf8'), readdirSync(folder)]).toEqual([3, 'old', ['state.json']]);
  });

  it('rejects at once on another error, and leaves no temporary file', async () => {
    const broken = failingRename(1, 'ENOSPC');
    await expect(atomicWrite(file, 'text', retry, broken.rename)).rejects.toThrow('ENOSPC: held');
    expect([broken.tries(), readdirSync(folder)]).toEqual([1, []]);
  });
});
