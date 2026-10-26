/**
 * The toolbar's host on the real VS Code: ToolbarHost implemented with VS Code's API. With extension.ts, the only file
 * that uses the module 'vscode', so all other code runs against fakes in tests.
 */

import * as vscode from 'vscode';
import { mediaFolder } from '../panes/media';
import { paneViewId } from '../toolbar/identity';
import { randomNonce } from '../utils/nonce';
import type { SettingTarget, SettingValues } from './button-host';
import type { PageResources, PaneDefinition, PanePage } from './pane';
import type { Disposable, ToolbarHost } from './toolbar-host';

/** VS Code's configuration target for each place the toolbar writes settings to. */
const configurationTargets: Readonly<Record<SettingTarget, vscode.ConfigurationTarget>> = {
  global: vscode.ConfigurationTarget.Global,
  workspace: vscode.ConfigurationTarget.Workspace,
};

/** ToolbarHost on VS Code. */
export class VscodeHost implements ToolbarHost {
  /** The panes' views VS Code has built and not disposed, by view id. */
  private readonly builtViews = new Map<string, vscode.WebviewView>();

  /**
   * Creates the host.
   * @param extensionUri the folder the extension runs from; a pane's page loads the files of its media folder
   */
  constructor(private readonly extensionUri: vscode.Uri) {}

  // -------------------------------------------------------------------------------------------------------------
  // What a button's action may do
  // -------------------------------------------------------------------------------------------------------------

  /**
   * Runs a VS Code command.
   * @param commandId the command's id
   * @param args the arguments passed to it
   * @returns what the command returned
   */
  async runCommand(commandId: string, ...args: readonly unknown[]): Promise<unknown> {
    return vscode.commands.executeCommand(commandId, ...args);
  }

  /**
   * Reads a setting's current value.
   * @param key the setting's full key
   * @returns its value, or undefined when no extension declares it
   */
  readSetting(key: string): unknown {
    return vscode.workspace.getConfiguration().get(key);
  }

  /**
   * Writes settings one at a time, each with its own update at the mapped target; undefined removes the value.
   * @param values the settings to write, by full key
   * @param target where to write them
   * @returns when every setting is written; rejects as soon as VS Code refuses one
   */
  async writeSettings(values: SettingValues, target: SettingTarget): Promise<void> {
    const configuration = vscode.workspace.getConfiguration();
    for (const [key, value] of Object.entries(values)) {
      await configuration.update(key, value, configurationTargets[target]);
    }
  }

  /**
   * Tells whether a pane's view is on the screen now.
   * @param viewId the view's id
   * @returns the view's own visible; false while VS Code has not built it or has disposed it
   */
  isPaneVisible(viewId: string): boolean {
    return this.builtViews.get(viewId)?.visible ?? false;
  }

  // -------------------------------------------------------------------------------------------------------------
  // What the toolbar itself does
  // -------------------------------------------------------------------------------------------------------------

  /**
   * Registers a command.
   * @param commandId the command's id
   * @param handler what running the command does
   * @returns what unregisters the command
   */
  registerCommand(commandId: string, handler: () => Promise<void>): Disposable {
    return vscode.commands.registerCommand(commandId, handler);
  }

  /**
   * Registers a pane's view with VS Code, which calls back when it first shows the view.
   * @param pane the pane
   * @returns what unregisters it
   */
  registerPane(pane: PaneDefinition): Disposable {
    return vscode.window.registerWebviewViewProvider(paneViewId(pane), { resolveWebviewView: (view) => this.buildPane(pane, view) });
  }

  /**
   * Reads a setting's value in the user's own settings only.
   * @param key the setting's full key
   * @returns what VS Code's inspect gives as the global (user) value
   */
  readUserSetting(key: string): unknown {
    return vscode.workspace.getConfiguration().inspect(key)?.globalValue;
  }

  /**
   * Calls a listener whenever one of the given settings changes, and for no other change.
   * @param keys the settings' full keys
   * @param listener what to call
   * @returns what stops the watch
   */
  watchSettings(keys: readonly string[], listener: () => void): Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (keys.some((key) => event.affectsConfiguration(key))) listener();
    });
  }

  /**
   * Lists the folders open in the window.
   * @returns the file system path of each workspace folder
   */
  workspaceFolderPaths(): string[] {
    return (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath);
  }

  /**
   * Shows an error message in VS Code, without waiting for the user to close it.
   * @param message the text to show
   */
  showError(message: string): void {
    void vscode.window.showErrorMessage(message);
  }

  // -------------------------------------------------------------------------------------------------------------
  // Panes
  // -------------------------------------------------------------------------------------------------------------

  /**
   * Builds a pane's view when VS Code first shows it: scripts on, only the media folder loadable. The logic is
   * connected before the page is set, so the page's first message is heard. When VS Code disposes the view (the user
   * hid it from the panel), the logic is disconnected and the view forgotten. Its page is rebuilt each time the view
   * shows again (no retainContextWhenHidden): the page asks for the state when it loads.
   * @param pane the pane
   * @param view the view VS Code built
   */
  private buildPane(pane: PaneDefinition, view: vscode.WebviewView): void {
    const viewId = paneViewId(pane);
    const media = vscode.Uri.joinPath(this.extensionUri, ...mediaFolder);
    view.webview.options = { enableScripts: true, localResourceRoots: [media] };
    const connection = pane.connect(pageOf(view.webview), this);
    view.webview.html = pane.html(resourcesOf(view.webview, media));
    this.builtViews.set(viewId, view);
    view.onDidDispose(() => {
      connection.dispose();
      this.builtViews.delete(viewId);
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// A webview as a pane's logic and page see it
// ---------------------------------------------------------------------------------------------------------------

/**
 * Wraps a webview as the page a pane's logic talks to. A message posted while the page is not loaded is lost
 * (postMessage then answers false), so a page asks for what it needs once it has loaded.
 * @param webview the view's webview
 * @returns the page
 */
function pageOf(webview: vscode.Webview): PanePage {
  return {
    post: (message) => void webview.postMessage(message),
    onMessage: (listener) => webview.onDidReceiveMessage(listener),
  };
}

/**
 * Gives a page its media URLs, its content security policy's source and a fresh nonce.
 * @param webview the view's webview
 * @param media the media folder
 * @returns the resources
 */
function resourcesOf(webview: vscode.Webview, media: vscode.Uri): PageResources {
  return {
    mediaUrl: (fileName) => webview.asWebviewUri(vscode.Uri.joinPath(media, fileName)).toString(),
    cspSource: webview.cspSource,
    nonce: randomNonce(),
  };
}
