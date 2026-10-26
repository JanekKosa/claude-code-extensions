/**
 * Tests the manifest builder: exactly the expected `contributes` for a two-button fixture with one pane, a setting
 * typed by its default, and, in the real package.json, only properties VS Code accepts from an extension (brief 7.1),
 * every toolbar command hidden from the Command Palette, a declared command behind every menu item, the Chat colors
 * pane as one container in the bottom panel holding one webview view, and no other key in `contributes`.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { OwnedSetting } from '../../src/toolbar/contracts';
import { buildContributes, type Contributes } from '../../src/toolbar/manifest';
import { twoButtonToolbar } from '../fixtures/two-buttons';
import { packageJsonPath } from '../helpers/paths';

/** The properties VS Code accepts on an extension's command (brief 7.1, from VS Code's own messages). */
const commandProperties = ['command', 'title', 'shortTitle', 'category', 'icon', 'enablement'];

/** The properties VS Code accepts on an extension's menu item; there is no `toggled`. */
const menuItemProperties = ['command', 'alt', 'when', 'group', 'submenu'];

/** The `contributes` of the real package.json. */
const contributes = (JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { contributes: Contributes }).contributes;

/**
 * Lists the properties of some objects that are not in an allowed list.
 * @param objects the objects
 * @param allowed the allowed property names
 * @returns `<command>: <property>` for each property not allowed
 */
function unknownProperties(objects: readonly { readonly command: string }[], allowed: readonly string[]): string[] {
  return objects.flatMap((object) => Object.keys(object).filter((key) => !allowed.includes(key)).map((key) => `${object.command}: ${key}`));
}

describe('buildContributes', () => {
  it('builds exactly the expected contributes for two buttons in two places', () => {
    expect(buildContributes(twoButtonToolbar)).toStrictEqual({
      commands: [
        { command: 'claudeToolbar.first', title: 'Add a thing.', category: 'Claude Toolbar', icon: '$(add)' },
        { command: 'claudeToolbar.second.on', title: 'Second is on. Click to turn it off.', category: 'Claude Toolbar', icon: '$(check)' },
        { command: 'claudeToolbar.second.off', title: 'Second is off. Click to turn it on.', category: 'Claude Toolbar', icon: '$(close)' },
      ],
      menus: {
        'view/title': [
          { command: 'claudeToolbar.first', when: "view == 'fixtureView' || view == 'otherFixtureView'", group: 'navigation@1' },
          {
            command: 'claudeToolbar.second.on',
            when: "(view == 'fixtureView' || view == 'otherFixtureView') && config.claudeToolbar.second",
            group: 'navigation@2',
          },
          {
            command: 'claudeToolbar.second.off',
            when: "(view == 'fixtureView' || view == 'otherFixtureView') && !config.claudeToolbar.second",
            group: 'navigation@2',
          },
        ],
        'editor/title': [
          { command: 'claudeToolbar.first', when: "activeWebviewPanelId == 'fixturePanel'", group: 'navigation@1' },
          { command: 'claudeToolbar.second.on', when: "activeWebviewPanelId == 'fixturePanel' && config.claudeToolbar.second", group: 'navigation@2' },
          { command: 'claudeToolbar.second.off', when: "activeWebviewPanelId == 'fixturePanel' && !config.claudeToolbar.second", group: 'navigation@2' },
        ],
        commandPalette: [
          { command: 'claudeToolbar.first', when: 'false' },
          { command: 'claudeToolbar.second.on', when: 'false' },
          { command: 'claudeToolbar.second.off', when: 'false' },
        ],
      },
      viewsContainers: { panel: [{ id: 'claudeToolbar-fixturePane', title: 'Fixture pane', icon: '$(add)' }] },
      views: { 'claudeToolbar-fixturePane': [{ type: 'webview', id: 'claudeToolbar.fixturePane', name: 'Fixture pane', icon: '$(add)' }] },
      configuration: {
        title: 'Claude Toolbar',
        properties: {
          'claudeToolbar.second': { type: 'boolean', default: true, description: 'Turns the second button on.', scope: 'window' },
        },
      },
    });
  });

  it('types a setting by its default, and builds no container or view without panes', () => {
    const settings: OwnedSetting[] = [
      { key: 'claudeToolbar.label', default: 'Chat', description: 'Label.', scope: 'application' },
      { key: 'claudeToolbar.ratio', default: 0.5, description: 'Ratio.', scope: 'machine' },
      { key: 'claudeToolbar.on', default: false, description: 'On.', scope: 'window' },
    ];
    const built = buildContributes({ buttons: [], panes: [], settings, places: [] });
    expect([built.configuration, built.viewsContainers, built.views]).toStrictEqual([
      {
        title: 'Claude Toolbar',
        properties: {
          'claudeToolbar.label': { type: 'string', default: 'Chat', description: 'Label.', scope: 'application' },
          'claudeToolbar.ratio': { type: 'number', default: 0.5, description: 'Ratio.', scope: 'machine' },
          'claudeToolbar.on': { type: 'boolean', default: false, description: 'On.', scope: 'window' },
        },
      },
      { panel: [] },
      {},
    ]);
  });

  it('writes only properties VS Code accepts on commands and menu items', () => {
    for (const built of [buildContributes(twoButtonToolbar), contributes]) {
      expect(unknownProperties(built.commands, commandProperties)).toEqual([]);
      expect(unknownProperties(Object.values(built.menus).flat(), menuItemProperties)).toEqual([]);
    }
  });
});

describe('the contributes of package.json', () => {
  it('hide every toolbar command from the Command Palette', () => {
    const hidden = contributes.menus.commandPalette.filter((item) => item.when === 'false').map((item) => item.command);
    expect(hidden).toEqual(contributes.commands.map((command) => command.command));
  });

  it('declare the command of every menu item', () => {
    const declared = new Set(contributes.commands.map((command) => command.command));
    expect(Object.values(contributes.menus).flat().filter((item) => !declared.has(item.command))).toEqual([]);
  });

  it('declare the Chat colors pane: one container in the bottom panel, holding one webview view claudeToolbar.chatColors', () => {
    expect([contributes.viewsContainers, contributes.views]).toStrictEqual([
      { panel: [{ id: 'claudeToolbar-chatColors', title: 'Chat colors', icon: '$(symbol-color)' }] },
      { 'claudeToolbar-chatColors': [{ type: 'webview', id: 'claudeToolbar.chatColors', name: 'Chat colors', icon: '$(symbol-color)' }] },
    ]);
  });

  it('hold no key besides commands, menus, the configuration, the view containers and the views', () => {
    expect(Object.keys(contributes).sort()).toEqual(['commands', 'configuration', 'menus', 'views', 'viewsContainers']);
  });
});
