/**
 * The stand-in for the module 'vscode' in the unit tests: vitest.config.mts aliases 'vscode' to this file, since
 * the real module exists only inside VS Code. It fakes only what src\host\vscode-host.ts and src\extension.ts use,
 * and types each faked member with its real type from @types/vscode (a Pick of the real namespace or interface),
 * so `npm run typecheck` proves the fake has VS Code's shapes. `fakeVscode` holds what VS Code would hold and
 * records what the tests need to see: the registered commands and view providers, every settings update with its
 * target, the error messages shown, the webview views built. The open folders are none unless a test sets them. A test changes settings (the user's, or a workspace's),
 * fires a settings change, builds a registered view as VS Code does when it first shows one, sends a message from a
 * view's page, hides a view or disposes it through it.
 */

import type * as vscode from 'vscode';

// ---------------------------------------------------------------------------------------------------------------
// What the tests read and drive
// ---------------------------------------------------------------------------------------------------------------

/** One settings update, as the code under test asked for it. */
export interface RecordedUpdate {
  /** The setting's full key. */
  readonly key: string;
  /** The value written. */
  readonly value: unknown;
  /** The target the update named. */
  readonly target: vscode.ConfigurationTarget | boolean | null | undefined;
}

/** One executeCommand call. */
export interface RecordedCommandRun {
  readonly commandId: string;
  readonly args: readonly unknown[];
}

/** A command handler, as registerCommand takes it. */
type CommandHandler = Parameters<typeof vscode.commands.registerCommand>[1];

/** A settings-change listener, as onDidChangeConfiguration takes it. */
type ConfigurationListener = Parameters<typeof vscode.workspace.onDidChangeConfiguration>[0];

/** The source a fake webview names for its content security policy, and the start of its resource URLs. */
export const fakeCspSource = 'https://file+.vscode-resource.vscode-cdn.net';

/** One webview view VS Code built for a registered provider, with what its webview was given and sent. */
export class FakeView {
  /** The page's HTML, as last set. */
  html = '';

  /** The webview's options, as last set. */
  options: vscode.WebviewOptions = {};

  /** Every message posted to the page, in order. */
  readonly posted: unknown[] = [];

  /** Whether the view is on the screen: VS Code builds a view when it first shows it. */
  visible = true;

  /** The live listeners for the page's messages. */
  readonly messageListeners = new Set<(message: unknown) => unknown>();

  /** The live listeners for the view's disposal. */
  readonly disposeListeners = new Set<() => unknown>();

  /**
   * Records a built view.
   * @param viewType the view's id
   */
  constructor(readonly viewType: string) {}

  /**
   * Sends a message from the page, as its script's postMessage would.
   * @param message the message
   */
  receive(message: unknown): void {
    for (const listener of [...this.messageListeners]) listener(message);
  }

  /**
   * Disposes the view, as VS Code does when the user hides it from its panel: its disposal listeners run.
   */
  dispose(): void {
    for (const listener of [...this.disposeListeners]) listener();
  }
}

/** The fake's state: VS Code's settings, commands and views, and the records the tests read. */
class FakeVscode {
  /** The user's settings by full key; a key not here is unset. */
  readonly settings = new Map<string, unknown>();

  /** The open workspace's settings by full key, which win over the user's when read with get. */
  readonly workspaceSettings = new Map<string, unknown>();

  /** The registered commands by id. */
  readonly commands = new Map<string, CommandHandler>();

  /** The registered webview view providers by view id. */
  readonly viewProviders = new Map<string, vscode.WebviewViewProvider>();

  /** Every executeCommand call, in order. */
  readonly commandRuns: RecordedCommandRun[] = [];

  /** Every settings update, in order, a refused one included. */
  readonly updates: RecordedUpdate[] = [];

  /** Every error message shown, in order. */
  readonly errorMessages: string[] = [];

  /** Every webview view built, in order. */
  readonly views: FakeView[] = [];

  /** The live settings-change listeners. */
  readonly configurationListeners = new Set<ConfigurationListener>();

  /** When set, every settings update is refused with this message, as VS Code refuses an unregistered setting. */
  updateFailure: string | undefined;

  /** The folders open in the window; undefined when none is, as in VS Code. */
  workspaceFolders: vscode.WorkspaceFolder[] | undefined;

  /**
   * Forgets everything: no settings, commands, providers, records, views or listeners, and updates succeed.
   */
  reset(): void {
    this.settings.clear();
    this.workspaceSettings.clear();
    this.commands.clear();
    this.viewProviders.clear();
    this.configurationListeners.clear();
    this.commandRuns.length = 0;
    this.updates.length = 0;
    this.errorMessages.length = 0;
    this.views.length = 0;
    this.updateFailure = undefined;
    this.workspaceFolders = undefined;
  }

  /**
   * Changes settings as VS Code would: applies the values (undefined removes one), then fires one change naming
   * their keys.
   * @param values the new values, by full key
   * @param store the user's settings (the default) or the workspace's
   */
  changeSettings(values: Readonly<Record<string, unknown>>, store: Map<string, unknown> = this.settings): void {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) store.delete(key);
      else store.set(key, value);
    }
    this.fireConfigurationChange(Object.keys(values));
  }

  /**
   * Fires a settings change naming the given keys, without changing a value. As in VS Code, the event's
   * affectsConfiguration(section) holds when the section is one of the keys or a parent section of one.
   * @param keys the changed settings' full keys
   */
  fireConfigurationChange(keys: readonly string[]): void {
    const event: vscode.ConfigurationChangeEvent = {
      affectsConfiguration: (section) => keys.some((key) => key === section || key.startsWith(`${section}.`)),
    };
    for (const listener of [...this.configurationListeners]) listener(event);
  }

  /**
   * Builds a registered view as VS Code does when it first shows it: a new view, shown, handed to its provider.
   * @param viewId the view's id
   * @returns the view
   */
  buildView(viewId: string): FakeView {
    const provider = this.viewProviders.get(viewId);
    if (provider === undefined) throw new Error(`No webview view provider is registered for ${viewId}.`);
    const view = new FakeView(viewId);
    this.views.push(view);
    void provider.resolveWebviewView(webviewViewOver(view), { state: undefined }, cancellationNever);
    return view;
  }
}

/** The fake's state, shared by the faked API below and the tests. */
export const fakeVscode = new FakeVscode();

// ---------------------------------------------------------------------------------------------------------------
// The faked API, each member typed with its real type
// ---------------------------------------------------------------------------------------------------------------

/** vscode.ConfigurationTarget, with VS Code's values. */
export const ConfigurationTarget: typeof vscode.ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 };

/** A URI: a scheme and a path, with forward slashes. */
class FakeUri implements vscode.Uri {
  readonly authority = '';
  readonly query = '';
  readonly fragment = '';

  /**
   * Creates the URI.
   * @param scheme its scheme
   * @param path its path
   */
  constructor(
    readonly scheme: string,
    readonly path: string,
  ) {}

  /** The path, as a file system path. */
  get fsPath(): string {
    return this.path;
  }

  /**
   * Returns the same URI: no test changes one.
   * @returns this URI
   */
  with(): vscode.Uri {
    return this;
  }

  /**
   * Writes the URI as text.
   * @returns `<scheme>:<path>`
   */
  toString(): string {
    return `${this.scheme}:${this.path}`;
  }

  /**
   * Writes the URI for JSON.
   * @returns its text
   */
  toJSON(): string {
    return this.toString();
  }
}

/** vscode.Uri: file URIs (whose path starts with /, as VS Code's do: /C:/folder) and joined paths. */
export const Uri: Pick<typeof vscode.Uri, 'file' | 'joinPath'> = {
  file: (path) => new FakeUri('file', `/${path.split('\\').join('/')}`),
  joinPath: (base, ...pathSegments) => new FakeUri(base.scheme, [base.path, ...pathSegments].join('/')),
};

/** vscode.commands: registered commands live in fakeVscode.commands; every run is recorded. */
export const commands: Pick<typeof vscode.commands, 'registerCommand' | 'executeCommand'> = {
  registerCommand(command, callback) {
    if (fakeVscode.commands.has(command)) throw new Error(`command '${command}' already exists`);
    fakeVscode.commands.set(command, callback);
    return { dispose: () => fakeVscode.commands.delete(command) };
  },
  async executeCommand<T>(command: string, ...rest: unknown[]): Promise<T> {
    fakeVscode.commandRuns.push({ commandId: command, args: rest });
    return (await fakeVscode.commands.get(command)?.(...rest)) as T;
  },
};

/** The part of a WorkspaceConfiguration the host uses. */
type FakeConfiguration = Pick<vscode.WorkspaceConfiguration, 'get' | 'update' | 'inspect'>;

/**
 * vscode.workspace: settings read from and written to fakeVscode's two stores; changes reach the listeners. The open
 * folders are fakeVscode's.
 */
export const workspace: Pick<typeof vscode.workspace, 'onDidChangeConfiguration' | 'workspaceFolders'> & {
  getConfiguration(...args: Parameters<typeof vscode.workspace.getConfiguration>): FakeConfiguration;
} = {
  get workspaceFolders() {
    return fakeVscode.workspaceFolders;
  },
  getConfiguration: (section) => configurationSection(section),
  onDidChangeConfiguration: (listener) => {
    fakeVscode.configurationListeners.add(listener);
    return { dispose: () => fakeVscode.configurationListeners.delete(listener) };
  },
};

/** vscode.window: every error message shown is recorded; every webview view provider registered is kept. */
export const window: Pick<typeof vscode.window, 'showErrorMessage' | 'registerWebviewViewProvider'> = {
  async showErrorMessage(message: string) {
    fakeVscode.errorMessages.push(message);
    return undefined;
  },
  registerWebviewViewProvider(viewId, provider) {
    if (fakeVscode.viewProviders.has(viewId)) throw new Error(`View provider for '${viewId}' already registered`);
    fakeVscode.viewProviders.set(viewId, provider);
    return { dispose: () => fakeVscode.viewProviders.delete(viewId) };
  },
};

/** A cancellation token that is never cancelled, as VS Code hands a provider while the view is wanted. */
const cancellationNever: vscode.CancellationToken = {
  isCancellationRequested: false,
  onCancellationRequested: () => ({ dispose: () => undefined }),
};

/**
 * Returns the API of a webview view over a FakeView's records.
 * @param view the records
 * @returns the view, as a provider gets it
 */
function webviewViewOver(view: FakeView): vscode.WebviewView {
  return {
    viewType: view.viewType,
    get visible() {
      return view.visible;
    },
    onDidDispose: (listener) => {
      view.disposeListeners.add(listener);
      return { dispose: () => view.disposeListeners.delete(listener) };
    },
    onDidChangeVisibility: () => ({ dispose: () => undefined }),
    show: () => {
      view.visible = true;
    },
    webview: {
      get options() {
        return view.options;
      },
      set options(value: vscode.WebviewOptions) {
        view.options = value;
      },
      get html() {
        return view.html;
      },
      set html(value: string) {
        view.html = value;
      },
      cspSource: fakeCspSource,
      asWebviewUri: (localResource) => new FakeUri('https', `//file+.vscode-resource.vscode-cdn.net${localResource.path}`),
      postMessage: async (message) => {
        view.posted.push(message);
        return true;
      },
      onDidReceiveMessage: (listener) => {
        view.messageListeners.add(listener);
        return { dispose: () => view.messageListeners.delete(listener) };
      },
    },
  };
}

/**
 * Returns the configuration of a section, whose keys are read and written below that section, as in VS Code. get
 * gives the workspace's value over the user's; inspect gives both apart. An update is recorded, then refused when
 * fakeVscode.updateFailure is set, else applied to the store of its target and announced.
 * @param section the section, or undefined for the whole configuration
 * @returns the configuration's get, update and inspect
 */
function configurationSection(section: string | undefined): FakeConfiguration {
  const fullKey = (key: string): string => (section ? `${section}.${key}` : key);
  return {
    get<T>(key: string, defaultValue?: T): T {
      for (const store of [fakeVscode.workspaceSettings, fakeVscode.settings]) {
        if (store.has(fullKey(key))) return store.get(fullKey(key)) as T;
      }
      return defaultValue as T;
    },
    inspect<T>(key: string) {
      return {
        key: fullKey(key),
        globalValue: fakeVscode.settings.get(fullKey(key)) as T | undefined,
        workspaceValue: fakeVscode.workspaceSettings.get(fullKey(key)) as T | undefined,
      };
    },
    async update(key, value, target) {
      fakeVscode.updates.push({ key: fullKey(key), value, target });
      if (fakeVscode.updateFailure !== undefined) throw new Error(fakeVscode.updateFailure);
      fakeVscode.changeSettings({ [fullKey(key)]: value }, target === ConfigurationTarget.Workspace ? fakeVscode.workspaceSettings : fakeVscode.settings);
    },
  };
}
