/**
 * TranscriptFiles for tests: folders and transcripts live in maps, every read of a file's end is recorded, and a test
 * fires a change in a folder, which calls that folder's live watches as Node's watch would.
 */

import { dirname } from 'node:path';
import type { Disposable } from '../../src/host/toolbar-host';
import type { TranscriptFile, TranscriptFiles } from '../../src/session/transcript-files';

/** One transcript: when it was written last, and its text. */
interface FakeTranscript {
  readonly modifiedMs: number;
  readonly text: string;
}

/** One recorded read of a file's end. */
export interface RecordedTailRead {
  readonly path: string;
  readonly bytes: number;
}

/** The fake file access. */
export class FakeTranscriptFiles implements TranscriptFiles {
  /** The sub-folder names of each folder that exists, by folder. */
  readonly folders = new Map<string, string[]>();

  /** The transcripts, by path. */
  readonly files = new Map<string, FakeTranscript>();

  /** Every readTail call, in order. */
  readonly tailReads: RecordedTailRead[] = [];

  /** The live watches' listeners, by folder. */
  private readonly listeners = new Map<string, Set<() => void>>();

  /**
   * Adds a folder that exists, with its sub-folders.
   * @param folder the folder
   * @param names its sub-folders' names
   */
  addFolder(folder: string, names: readonly string[] = []): void {
    this.folders.set(folder, [...names]);
  }

  /**
   * Writes a transcript.
   * @param path its path
   * @param modifiedMs its last write time
   * @param text its text
   */
  writeTranscript(path: string, modifiedMs: number, text: string): void {
    this.files.set(path, { modifiedMs, text });
  }

  /**
   * Fires a change in a folder.
   * @param folder the folder
   */
  change(folder: string): void {
    for (const listener of [...(this.listeners.get(folder) ?? [])]) listener();
  }

  /**
   * Lists the folders being watched now.
   * @returns their paths
   */
  watchedFolders(): string[] {
    return [...this.listeners].filter(([, listeners]) => listeners.size > 0).map(([folder]) => folder);
  }

  /**
   * Lists a folder's sub-folders.
   * @param folder the folder
   * @returns their names; none when it does not exist
   */
  folderNames(folder: string): string[] {
    return [...(this.folders.get(folder) ?? [])];
  }

  /**
   * Lists the transcripts directly in a folder.
   * @param folder the folder
   * @returns each with its last write time
   */
  transcripts(folder: string): TranscriptFile[] {
    return [...this.files].filter(([path]) => dirname(path) === folder).map(([path, file]) => ({ path, modifiedMs: file.modifiedMs }));
  }

  /**
   * Records the read and answers the transcript's text.
   * @param path the file
   * @param bytes how many bytes were asked for
   * @returns the whole text; empty when there is no such file
   */
  readTail(path: string, bytes: number): string {
    this.tailReads.push({ path, bytes });
    return this.files.get(path)?.text ?? '';
  }

  /**
   * Adds a watch of an existing folder.
   * @param folder the folder
   * @param listener what to call on a change
   * @returns what removes the watch; undefined when the folder does not exist
   */
  watch(folder: string, listener: () => void): Disposable | undefined {
    if (!this.folders.has(folder)) return undefined;
    const listeners = this.listeners.get(folder) ?? new Set();
    this.listeners.set(folder, listeners.add(listener));
    return { dispose: () => listeners.delete(listener) };
  }
}
