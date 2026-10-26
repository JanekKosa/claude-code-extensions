/**
 * What the toolbar itself needs from VS Code, beyond what a button's action may do (ButtonHost): register a command,
 * register a pane, read the user's own settings, watch settings, list the open folders, show an error. The registration and the panes get
 * this interface, never VS Code itself, so they run against a fake in tests. The adapter that implements it on VS Code
 * is host\vscode-host.ts.
 */

import type { ButtonHost } from './button-host';
import type { PaneDefinition } from './pane';

/** Something to release when the extension stops, such as a registered command or a settings watch. */
export interface Disposable {
  /** Releases it. */
  dispose(): void;
}

/** The part of VS Code the toolbar itself uses. */
export interface ToolbarHost extends ButtonHost {
  /**
   * Registers a command.
   * @param commandId the command's id
   * @param handler what running the command does
   * @returns what unregisters the command
   */
  registerCommand(commandId: string, handler: () => Promise<void>): Disposable;

  /**
   * Registers a pane, whose view package.json declares: VS Code builds its page when it first shows the view.
   * @param pane the pane
   * @returns what unregisters it
   */
  registerPane(pane: PaneDefinition): Disposable;

  /**
   * Reads a setting's value in the user's own settings only, without the defaults or a workspace's values.
   * @param key the setting's full key
   * @returns the value the user's settings hold, or undefined when they hold none
   */
  readUserSetting(key: string): unknown;

  /**
   * Calls a listener whenever one of the given settings changes, and for no other change.
   * @param keys the settings' full keys
   * @param listener what to call
   * @returns what stops the watch
   */
  watchSettings(keys: readonly string[], listener: () => void): Disposable;

  /**
   * Lists the folders open in the window, where Claude's chats run.
   * @returns their file system paths; none when no folder is open
   */
  workspaceFolderPaths(): string[];

  /**
   * Shows the user an error message.
   * @param message the text to show
   */
  showError(message: string): void;
}
