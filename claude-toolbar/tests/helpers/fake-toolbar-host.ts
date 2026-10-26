/**
 * A ToolbarHost for tests: a FakeButtonHost that also records registered commands and panes, settings watches and
 * errors shown. Its settings are the user's own, so readUserSetting reads the same values as readSetting. A test
 * changes settings through it, which calls the watches of the changed keys, as VS Code would.
 */

import type { PaneDefinition } from '../../src/host/pane';
import type { Disposable, ToolbarHost } from '../../src/host/toolbar-host';
import { FakeButtonHost } from './fake-button-host';

/** One settings watch. */
export interface RecordedWatch {
  readonly keys: readonly string[];
  readonly listener: () => void;
  disposed: boolean;
}

/** What a test may give the fake host. */
export interface FakeToolbarHostOptions {
  /** The user's settings it starts with, by full key. */
  readonly settings?: Readonly<Record<string, unknown>>;
}

/** The fake host. */
export class FakeToolbarHost extends FakeButtonHost implements ToolbarHost {
  /** The registered commands by id. */
  readonly registeredCommands = new Map<string, () => Promise<void>>();

  /** The registered panes, in order. */
  readonly registeredPanes: PaneDefinition[] = [];

  /** Every settings watch, in order. */
  readonly watches: RecordedWatch[] = [];

  /** Every error shown, in order. */
  readonly errors: string[] = [];

  /** The folders open in the window; a test fills it. */
  readonly folderPaths: string[] = [];

  /**
   * Creates the host.
   * @param options its settings
   */
  constructor(options: FakeToolbarHostOptions = {}) {
    super(options.settings);
  }

  /**
   * Records the command.
   * @param commandId the command's id
   * @param handler what running it does
   * @returns what unregisters it
   */
  registerCommand(commandId: string, handler: () => Promise<void>): Disposable {
    this.registeredCommands.set(commandId, handler);
    return { dispose: () => this.registeredCommands.delete(commandId) };
  }

  /**
   * Records the pane.
   * @param pane the pane
   * @returns what forgets it
   */
  registerPane(pane: PaneDefinition): Disposable {
    this.registeredPanes.push(pane);
    return { dispose: () => this.registeredPanes.splice(this.registeredPanes.indexOf(pane), 1) };
  }

  /**
   * Reads a user setting.
   * @param key the full key
   * @returns its current value
   */
  readUserSetting(key: string): unknown {
    return this.settings[key];
  }

  /**
   * Records the watch.
   * @param keys the watched settings' keys
   * @param listener what to call when one changes
   * @returns what marks the watch disposed
   */
  watchSettings(keys: readonly string[], listener: () => void): Disposable {
    const watch: RecordedWatch = { keys, listener, disposed: false };
    this.watches.push(watch);
    return {
      dispose: () => {
        watch.disposed = true;
      },
    };
  }

  /**
   * Lists the open folders.
   * @returns the folders the test put in folderPaths
   */
  workspaceFolderPaths(): string[] {
    return [...this.folderPaths];
  }

  /**
   * Records the error.
   * @param message its text
   */
  showError(message: string): void {
    this.errors.push(message);
  }

  /**
   * Changes settings as a user would: applies them, then calls every live watch of a changed key once.
   * @param values the new values, by full key
   */
  changeSettings(values: Readonly<Record<string, unknown>>): void {
    Object.assign(this.settings, values);
    for (const watch of this.watches) {
      if (!watch.disposed && watch.keys.some((key) => key in values)) watch.listener();
    }
  }
}
