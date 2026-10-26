/**
 * What a toolbar button's action may do in VS Code: run a command, read a setting, write settings, tell whether a pane
 * shows. Actions get this interface, never VS Code itself, so they run against a fake in tests. The adapter that
 * implements it on VS Code is host\vscode-host.ts.
 */

import type { JsonObject } from '../utils/json-object';

// ---------------------------------------------------------------------------------------------------------------
// Settings values
// ---------------------------------------------------------------------------------------------------------------

/** A value a setting can hold, as the toolbar declares and reads it. */
export type SettingValue = boolean | number | string;

/**
 * Settings by their full key, such as `{ "claudeCode.focusView": true }`; an object-valued setting such as
 * `workbench.colorCustomizations` takes an object. undefined removes the value set at the target, so the setting goes
 * back to its default.
 */
export type SettingValues = Readonly<Record<string, SettingValue | JsonObject | undefined>>;

/** Where settings are written: the user's own settings ('global') or the open workspace's ('workspace'). */
export type SettingTarget = 'global' | 'workspace';

// ---------------------------------------------------------------------------------------------------------------
// The host and the actions that use it
// ---------------------------------------------------------------------------------------------------------------

/** The part of VS Code a button's action may use. */
export interface ButtonHost {
  /**
   * Runs a VS Code command.
   * @param commandId the command's id
   * @param args the arguments passed to it
   * @returns what the command returned
   */
  runCommand(commandId: string, ...args: readonly unknown[]): Promise<unknown>;

  /**
   * Reads a setting's current value.
   * @param key the setting's full key
   * @returns its value, or undefined when no extension declares it
   */
  readSetting(key: string): unknown;

  /**
   * Writes settings, each as an explicit value, or removes them (undefined).
   * @param values the settings to write, by full key
   * @param target where to write them
   * @returns when every setting is written
   */
  writeSettings(values: SettingValues, target: SettingTarget): Promise<void>;

  /**
   * Tells whether a pane's view is on the screen now.
   * @param viewId the view's id
   * @returns true while VS Code shows it; false when it is hidden or VS Code has not built it yet
   */
  isPaneVisible(viewId: string): boolean;
}

/** What a click on a button's look does. */
export type ButtonAction = (host: ButtonHost) => Promise<void>;
