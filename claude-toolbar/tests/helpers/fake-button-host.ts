/**
 * A ButtonHost for tests: the settings live in a plain object, and every write and every command run is recorded. A
 * write is also applied (undefined removes a value), so the settings read afterwards are the ones VS Code would hold.
 * Which panes show is a set a test fills.
 */

import type { ButtonHost, SettingTarget, SettingValues } from '../../src/host/button-host';

/** One recorded call of writeSettings. */
export interface RecordedWrite {
  readonly values: SettingValues;
  readonly target: SettingTarget;
}

/** One recorded call of runCommand. */
export interface RecordedCommand {
  readonly commandId: string;
  readonly args: readonly unknown[];
}

/** The fake host. */
export class FakeButtonHost implements ButtonHost {
  /** Every writeSettings call, in order. */
  readonly writes: RecordedWrite[] = [];

  /** Every runCommand call, in order. */
  readonly commands: RecordedCommand[] = [];

  /** The view ids of the panes on the screen. */
  readonly visiblePanes = new Set<string>();

  /** The current settings, by full key. */
  protected readonly settings: Record<string, unknown>;

  /**
   * Creates the host.
   * @param settings the settings it starts with, by full key
   */
  constructor(settings: Readonly<Record<string, unknown>> = {}) {
    this.settings = { ...settings };
  }

  /**
   * Records the command.
   * @param commandId the command's id
   * @param args its arguments
   * @returns undefined
   */
  async runCommand(commandId: string, ...args: readonly unknown[]): Promise<unknown> {
    this.commands.push({ commandId, args });
    return undefined;
  }

  /**
   * Reads a setting.
   * @param key the full key
   * @returns its current value
   */
  readSetting(key: string): unknown {
    return this.settings[key];
  }

  /**
   * Records the write, then applies it: undefined removes the value.
   * @param values the settings to write
   * @param target where they are written
   * @returns when done
   */
  async writeSettings(values: SettingValues, target: SettingTarget): Promise<void> {
    this.writes.push({ values, target });
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) delete this.settings[key];
      else this.settings[key] = value;
    }
  }

  /**
   * Tells whether a pane shows.
   * @param viewId the pane's view id
   * @returns true when the test put it in visiblePanes
   */
  isPaneVisible(viewId: string): boolean {
    return this.visiblePanes.has(viewId);
  }
}
