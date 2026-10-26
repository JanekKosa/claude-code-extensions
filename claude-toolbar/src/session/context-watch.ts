/**
 * Follows the context size of the newest Claude chat of the open folders. It watches each folder's transcript folder
 * and Claude's projects folder (where a first chat creates the transcript folder). After a change it waits the
 * refresh time (changes meanwhile join the wait), then reads the end of the newest transcript and reports its latest size. VS Code does not say which
 * transcript belongs to which open chat, so with several chats it follows the one written last.
 */

import { join } from 'node:path';
import type { Disposable } from '../host/toolbar-host';
import { lastContextSize } from './context-size';
import type { TranscriptFile, TranscriptFiles } from './transcript-files';
import { findProjectFolder } from './transcript-folder';

/** What the watch follows, how, and where it reports. */
export interface ContextWatchOptions {
  /** Claude's projects folder. */
  readonly projectsFolder: string;
  /** The open folders' paths. */
  readonly workspacePaths: readonly string[];
  /** How long to wait after a change before reading, in milliseconds; read at each change. */
  readonly refreshMs: () => number;
  /** How many bytes of the transcript's end to read; read at each read. */
  readonly tailBytes: () => number;
  /** Gets each size read: tokens, or undefined when no chat has a size yet. */
  readonly report: (tokens: number | undefined) => void;
}

/** The watch. */
export class ContextWatch implements Disposable {
  /** The folder watches, by folder. */
  private readonly watches = new Map<string, Disposable | undefined>();

  /** The waiting read, if any. */
  private timer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Creates the watch; start begins it.
   * @param files the file access
   * @param options what it follows, how, and where it reports
   */
  constructor(
    private readonly files: TranscriptFiles,
    private readonly options: ContextWatchOptions,
  ) {}

  // -------------------------------------------------------------------------------------------------------------
  // Lifetime
  // -------------------------------------------------------------------------------------------------------------

  /**
   * Watches the projects folder and the transcript folders, and reports the size there is now.
   */
  start(): void {
    this.watchFolder(this.options.projectsFolder);
    this.refresh();
  }

  /**
   * Stops every folder watch and the waiting read.
   */
  dispose(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
    for (const watch of this.watches.values()) watch?.dispose();
    this.watches.clear();
  }

  // -------------------------------------------------------------------------------------------------------------
  // Reading
  // -------------------------------------------------------------------------------------------------------------

  /**
   * Starts the transcript folders' watches that are missing, then reports the newest transcript's size.
   */
  private refresh(): void {
    const folders = this.projectFolders();
    folders.forEach((folder) => this.watchFolder(folder));
    this.options.report(this.newestSize(folders));
  }

  /**
   * Reads the latest size of the newest transcript.
   * @param folders the transcript folders
   * @returns its size, or undefined when there is no transcript or no size in it
   */
  private newestSize(folders: readonly string[]): number | undefined {
    const newest = folders
      .flatMap((folder) => this.files.transcripts(folder))
      .reduce<TranscriptFile | undefined>((latest, file) => (latest === undefined || file.modifiedMs > latest.modifiedMs ? file : latest), undefined);
    return newest === undefined ? undefined : lastContextSize(this.files.readTail(newest.path, this.options.tailBytes()));
  }

  /**
   * Finds the transcript folders of the open folders that exist.
   * @returns their paths
   */
  private projectFolders(): string[] {
    const existing = this.files.folderNames(this.options.projectsFolder);
    return this.options.workspacePaths.flatMap((path) => {
      const name = findProjectFolder(existing, path);
      return name === undefined ? [] : [join(this.options.projectsFolder, name)];
    });
  }

  // -------------------------------------------------------------------------------------------------------------
  // Watching
  // -------------------------------------------------------------------------------------------------------------

  /**
   * Watches a folder unless a watch of it already runs; a missing folder is tried again at the next refresh.
   * @param folder the folder
   */
  private watchFolder(folder: string): void {
    if (this.watches.get(folder) !== undefined) return;
    this.watches.set(folder, this.files.watch(folder, () => this.schedule()));
  }

  /**
   * Waits the refresh time, then refreshes. A change while it waits joins that wait, so steady writing still shows
   * a new size once per refresh time.
   */
  private schedule(): void {
    if (this.timer !== undefined) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.refresh();
    }, this.options.refreshMs());
  }
}
