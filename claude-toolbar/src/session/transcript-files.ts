/**
 * The file access the context watch needs: list folders and transcripts, read a file's end, watch a folder. The watch
 * gets this interface, so its tests run on a fake; nodeTranscriptFiles is the one on Node's file system. A folder or
 * file that is missing, or vanishes while it is read, reads as empty: Claude creates and removes them on its own.
 */

import { closeSync, fstatSync, openSync, readdirSync, readSync, statSync, watch } from 'node:fs';
import { join } from 'node:path';
import type { Disposable } from '../host/toolbar-host';
import { whenPresent } from '../utils/when-present';

/** A transcript file and when it was last written. */
export interface TranscriptFile {
  readonly path: string;
  readonly modifiedMs: number;
}

/** The file access the context watch uses. */
export interface TranscriptFiles {
  /**
   * Lists the sub-folders of a folder.
   * @param folder the folder
   * @returns their names; none when the folder is missing
   */
  folderNames(folder: string): string[];

  /**
   * Lists the transcripts directly in a folder: its `.jsonl` files.
   * @param folder the folder
   * @returns each with its last write time; none when the folder is missing
   */
  transcripts(folder: string): TranscriptFile[];

  /**
   * Reads the end of a file.
   * @param path the file
   * @param bytes how many bytes at most, counted from the end
   * @returns the bytes as UTF-8 text; empty when the file is missing
   */
  readTail(path: string, bytes: number): string;

  /**
   * Calls a listener on every change directly inside a folder.
   * @param folder the folder
   * @param listener what to call
   * @returns what stops the watch; undefined when the folder is missing
   */
  watch(folder: string, listener: () => void): Disposable | undefined;
}

/** The file extension of a transcript. */
const transcriptExtension = '.jsonl';

/** TranscriptFiles on Node's file system. */
export const nodeTranscriptFiles: TranscriptFiles = {
  folderNames: (folder) => whenPresent([], () => readdirSync(folder, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)),

  transcripts: (folder) =>
    whenPresent([], () =>
      readdirSync(folder, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(transcriptExtension))
        .flatMap((entry) => whenPresent([], () => [{ path: join(folder, entry.name), modifiedMs: statSync(join(folder, entry.name)).mtimeMs }])),
    ),

  readTail: (path, bytes) => whenPresent('', () => readFileTail(path, bytes)),

  watch: (folder, listener) =>
    whenPresent(undefined, () => {
      const watcher = watch(folder, { persistent: false }, () => listener());
      watcher.on('error', () => watcher.close());
      return { dispose: () => watcher.close() };
    }),
};

/**
 * Reads the last bytes of a file.
 * @param path the file
 * @param bytes how many bytes at most
 * @returns them as UTF-8 text
 */
function readFileTail(path: string, bytes: number): string {
  const descriptor = openSync(path, 'r');
  try {
    const size = fstatSync(descriptor).size;
    const length = Math.max(0, Math.min(bytes, size));
    const buffer = Buffer.alloc(length);
    const read = readSync(descriptor, buffer, 0, length, size - length);
    return buffer.toString('utf8', 0, read);
  } finally {
    closeSync(descriptor);
  }
}
