/**
 * Replaces a file in one step, so a reader sees the old text or the new, never half of it: the text goes into a
 * temporary file in the same folder, which is then renamed over the file. Generic: knows nothing of the toolbar.
 */

import { randomBytes } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { setTimeout as wait } from 'node:timers/promises';

/** How long a rename keeps trying while a reader holds the file. */
export interface RenameRetry {
  /** How many times to try, the first one included. */
  readonly attempts: number;
  /** How long to wait between two tries, in milliseconds. */
  readonly delayMs: number;
}

/** What renames one file over another. */
export type Rename = (from: string, to: string) => Promise<void>;

/**
 * The errors of a rename over a file someone holds open. On Windows a reader that holds the file open blocks the
 * rename, whatever sharing it opened with.
 */
const heldFileErrors: ReadonlySet<unknown> = new Set(['EPERM', 'EBUSY', 'EACCES']);

/** How many random bytes name the temporary file. */
const temporaryNameBytes = 6;

/**
 * Replaces a file's text in one step, creating its folder when missing. The temporary file never stays behind.
 * @param path the file
 * @param text its new text, written as UTF-8 without a byte-order mark
 * @param retry how long to try while the file is held
 * @param renameFile what renames the temporary file over the file
 * @returns when the file holds the text; rejects when it could not be written, or stayed held
 */
export async function atomicWrite(path: string, text: string, retry: RenameRetry, renameFile: Rename = rename): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomBytes(temporaryNameBytes).toString('hex')}.tmp`;
  try {
    await writeFile(temporary, text, 'utf8');
    await renameWhenFree(temporary, path, retry, renameFile);
  } finally {
    await rm(temporary, { force: true });
  }
}

/**
 * Renames a file, trying again while the target is held.
 * @param from the file to rename
 * @param to the file it replaces
 * @param retry how long to try
 * @param renameFile what renames it
 * @returns when it is renamed; rejects with the last error when tries run out, or at once with any other error
 */
async function renameWhenFree(from: string, to: string, retry: RenameRetry, renameFile: Rename): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await renameFile(from, to);
      return;
    } catch (error) {
      if (attempt >= retry.attempts || !heldFileErrors.has((error as NodeJS.ErrnoException).code)) throw error;
      await wait(retry.delayMs);
    }
  }
}
