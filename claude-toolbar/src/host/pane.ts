/**
 * What a pane is: a view in VS Code's bottom panel (where the Terminal sits) holding a web page (a webview view), and
 * the logic behind the page. A pane's folder in panes\ fills PaneDefinition in; the manifest declares its view and the
 * view's container, and the host registers it (host\vscode-host.ts on VS Code): when VS Code first shows the view, the
 * host lets the page load only the files of the media folder (panes\media.ts) and connects the logic to the page's
 * messages. Panes get these interfaces, never VS Code itself, so they run against fakes in tests.
 */

import type { Disposable, ToolbarHost } from './toolbar-host';

/** What a pane's page may load, as the host hands it to the page's HTML. */
export interface PageResources {
  /**
   * Gives the URL the page loads a file of the media folder from.
   * @param fileName the file's name in the media folder
   * @returns its URL, as the webview may load it
   */
  mediaUrl(fileName: string): string;

  /** Where the page's own files come from, as its content security policy names it. */
  readonly cspSource: string;

  /** A fresh random value; only the page's script tags that carry it run (its content security policy). */
  readonly nonce: string;
}

/** A pane's page, as the pane's logic sees it. */
export interface PanePage {
  /**
   * Sends a message to the page's script. A message sent while the pane is hidden is lost: the page asks for what it
   * needs each time it loads.
   * @param message the message, which must survive JSON
   */
  post(message: unknown): void;

  /**
   * Calls a listener for every message the page's script sends.
   * @param listener what to call, with the message as the page sent it
   * @returns what stops listening
   */
  onMessage(listener: (message: unknown) => void): Disposable;
}

/** What a pane's logic may use: reading the user's settings, writing and watching settings, and showing an error. */
export type PaneHost = Pick<ToolbarHost, 'readUserSetting' | 'writeSettings' | 'watchSettings' | 'showError'>;

/** A pane the toolbar puts in VS Code's bottom panel. */
export interface PaneDefinition {
  /** Unique within the toolbar, camelCase. Part of the view's id and its container's (toolbar\identity.ts). */
  readonly id: string;

  /** The title of the pane's tab in the panel. */
  readonly title: string;

  /** A codicon name, such as `symbol-color`: the pane's icon where VS Code shows one. */
  readonly icon: string;

  /**
   * Builds the page.
   * @param resources the media URLs and the nonce the page uses
   * @returns the page's HTML
   */
  html(resources: PageResources): string;

  /**
   * Connects the pane's logic to its page.
   * @param page the page
   * @param host what the logic may use
   * @returns what disconnects it, when VS Code disposes the view
   */
  connect(page: PanePage, host: PaneHost): Disposable;
}
