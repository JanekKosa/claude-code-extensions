/**
 * Tests the VS Code adapter against the fake 'vscode' (tests\fakes\vscode.ts): settings written with one update per
 * key at the mapped target (undefined removing one, an object written whole), settings read, the user's own value read
 * apart from a workspace's, commands run and registered, the settings watch limited to its keys, an error shown, and
 * panes: a provider registered under the pane's view id, the view built with scripts on and only the media folder
 * loadable, its page built from media URLs and a fresh nonce, its logic connected before the page is set and talking
 * both ways, whether it shows, and its logic disconnected and the view forgotten when VS Code disposes it.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageResources, PaneDefinition, PaneHost, PanePage } from '../../src/host/pane';
import { VscodeHost } from '../../src/host/vscode-host';
import { commands, ConfigurationTarget, fakeCspSource, fakeVscode, Uri } from '../fakes/vscode';

const focusView = 'claudeCode.focusView';
const customizations = 'workbench.colorCustomizations';

/** The extension's folder the host is given. */
const extensionUri = Uri.file('C:\\extensions\\claude-toolbar');

/** The fixture pane's view id. */
const viewId = 'claudeToolbar.fixture';

/** What a fixture pane saw. */
interface PaneRecord {
  readonly resources: PageResources[];
  readonly pages: PanePage[];
  readonly hosts: PaneHost[];
  readonly htmlWhenConnected: string[];
  disconnects: number;
}

/**
 * A fixture pane that records what the host gives it.
 * @returns the pane and its record
 */
function fixturePane(): { pane: PaneDefinition; record: PaneRecord } {
  const record: PaneRecord = { resources: [], pages: [], hosts: [], htmlWhenConnected: [], disconnects: 0 };
  const pane: PaneDefinition = {
    id: 'fixture',
    title: 'Fixture',
    icon: 'add',
    html: (resources) => {
      record.resources.push(resources);
      return `<p>${resources.mediaUrl('page.js')}</p>`;
    },
    connect: (page, host) => {
      record.pages.push(page);
      record.hosts.push(host);
      record.htmlWhenConnected.push(fakeVscode.views.at(-1)?.html ?? '');
      return { dispose: () => (record.disconnects += 1) };
    },
  };
  return { pane, record };
}

describe('VscodeHost', () => {
  /** A fresh host per test: a host remembers the views built. */
  let host: VscodeHost;

  beforeEach(() => {
    fakeVscode.reset();
    host = new VscodeHost(extensionUri);
  });

  describe('writeSettings', () => {
    it("makes one update per key, at ConfigurationTarget.Global for 'global', an object written whole", async () => {
      await host.writeSettings({ [focusView]: true, [customizations]: { descriptionForeground: '#4FA3E0' } }, 'global');
      expect(fakeVscode.updates).toStrictEqual([
        { key: focusView, value: true, target: ConfigurationTarget.Global },
        { key: customizations, value: { descriptionForeground: '#4FA3E0' }, target: ConfigurationTarget.Global },
      ]);
    });

    it("writes at ConfigurationTarget.Workspace for 'workspace'", async () => {
      await host.writeSettings({ [focusView]: false }, 'workspace');
      expect(fakeVscode.updates).toStrictEqual([{ key: focusView, value: false, target: ConfigurationTarget.Workspace }]);
    });

    it('removes a value written as undefined', async () => {
      fakeVscode.settings.set(customizations, { descriptionForeground: '#123ABC' });
      await host.writeSettings({ [customizations]: undefined }, 'global');
      expect([fakeVscode.updates, fakeVscode.settings.has(customizations)]).toStrictEqual([[{ key: customizations, value: undefined, target: ConfigurationTarget.Global }], false]);
    });

    it('rejects when VS Code refuses a setting, and writes none after it', async () => {
      fakeVscode.updateFailure = 'Unable to write to User Settings because claudeCode.focusView is not a registered configuration.';
      await expect(host.writeSettings({ [focusView]: true, [customizations]: {} }, 'global')).rejects.toThrow('not a registered configuration');
      expect(fakeVscode.updates.map((update) => update.key)).toEqual([focusView]);
    });
  });

  it('reads a setting, and undefined for one nobody set', () => {
    fakeVscode.settings.set(focusView, true);
    expect([host.readSetting(focusView), host.readSetting('editor.unknownSetting')]).toEqual([true, undefined]);
  });

  it("reads the user's own value of a setting, not a workspace's, and undefined while the user's settings hold none", () => {
    fakeVscode.workspaceSettings.set(customizations, { descriptionForeground: '#FF0000' });
    const onlyWorkspace = host.readUserSetting(customizations);
    fakeVscode.settings.set(customizations, { descriptionForeground: '#4FA3E0' });
    expect([onlyWorkspace, host.readUserSetting(customizations), host.readSetting(customizations)]).toStrictEqual([
      undefined,
      { descriptionForeground: '#4FA3E0' },
      { descriptionForeground: '#FF0000' },
    ]);
  });

  it('runs a command with its arguments and returns its result', async () => {
    commands.registerCommand('claude-vscode.fixture', (...args: unknown[]) => `ran with ${args.join(', ')}`);
    expect(await host.runCommand('claude-vscode.fixture', 1, 'two')).toBe('ran with 1, two');
    expect(fakeVscode.commandRuns).toStrictEqual([{ commandId: 'claude-vscode.fixture', args: [1, 'two'] }]);
  });

  it('registers a command, and unregisters it when disposed', async () => {
    const handler = vi.fn(async () => undefined);
    const registration = host.registerCommand('claudeToolbar.fixture', handler);
    await commands.executeCommand('claudeToolbar.fixture');
    registration.dispose();
    expect([handler.mock.calls.length, fakeVscode.commands.has('claudeToolbar.fixture')]).toEqual([1, false]);
  });

  describe('watchSettings', () => {
    it('calls its listener when one of its keys changed, and for no other change', () => {
      const listener = vi.fn();
      host.watchSettings([customizations, focusView], listener);
      fakeVscode.fireConfigurationChange(['editor.fontSize']);
      fakeVscode.fireConfigurationChange([customizations]);
      fakeVscode.fireConfigurationChange(['editor.fontSize', focusView]);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('stops when disposed', () => {
      const listener = vi.fn();
      host.watchSettings([customizations], listener).dispose();
      fakeVscode.fireConfigurationChange([customizations]);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('panes', () => {
    it("registers a provider under the pane's view id, and unregisters it when disposed", () => {
      const registration = host.registerPane(fixturePane().pane);
      const registered = fakeVscode.viewProviders.has(viewId);
      registration.dispose();
      expect([registered, fakeVscode.viewProviders.has(viewId)]).toEqual([true, false]);
    });

    it('builds the view with scripts on and only the media folder loadable', () => {
      host.registerPane(fixturePane().pane);
      expect(fakeVscode.buildView(viewId).options).toStrictEqual({ enableScripts: true, localResourceRoots: [Uri.joinPath(extensionUri, 'dist', 'media')] });
    });

    it("builds the page from media URLs the webview gives, the webview's CSP source and a fresh nonce for each build", () => {
      const { pane, record } = fixturePane();
      host.registerPane(pane);
      fakeVscode.buildView(viewId).dispose();
      const view = fakeVscode.buildView(viewId);
      const [first, second] = record.resources;
      expect(view.html).toBe(`<p>${fakeCspSource}/C:/extensions/claude-toolbar/dist/media/page.js</p>`);
      expect([first.cspSource, /^[A-Za-z0-9+/]{22}==$/.test(first.nonce), first.nonce === second.nonce]).toEqual([fakeCspSource, true, false]);
    });

    it('connects the logic before the page is set, with the host itself, and passes messages both ways', () => {
      const { pane, record } = fixturePane();
      host.registerPane(pane);
      const view = fakeVscode.buildView(viewId);
      const received: unknown[] = [];
      record.pages[0].onMessage((message) => received.push(message));
      view.receive({ type: 'ready' });
      record.pages[0].post({ type: 'state' });
      expect([record.htmlWhenConnected, record.hosts[0] === host, received, view.posted]).toStrictEqual([[''], true, [{ type: 'ready' }], [{ type: 'state' }]]);
    });

    it('tells whether the pane shows: not before VS Code builds it, then as the view says, and not once disposed', () => {
      host.registerPane(fixturePane().pane);
      const before = host.isPaneVisible(viewId);
      const view = fakeVscode.buildView(viewId);
      const shown = host.isPaneVisible(viewId);
      view.visible = false;
      const hidden = host.isPaneVisible(viewId);
      view.visible = true;
      view.dispose();
      expect([before, shown, hidden, host.isPaneVisible(viewId)]).toEqual([false, true, false, false]);
    });

    it('disconnects the logic when VS Code disposes the view, and connects it again when it builds the view again', () => {
      const { pane, record } = fixturePane();
      host.registerPane(pane);
      fakeVscode.buildView(viewId).dispose();
      fakeVscode.buildView(viewId);
      expect([record.disconnects, record.pages.length, host.isPaneVisible(viewId)]).toEqual([1, 2, true]);
    });
  });

  it('shows an error message once', () => {
    host.showError('Something failed.');
    expect(fakeVscode.errorMessages).toEqual(['Something failed.']);
  });
});
