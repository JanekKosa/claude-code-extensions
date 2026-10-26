/**
 * Tests how the built keys go into package.json's text: every other field and the order of the fields stay, a key of
 * `contributes` the builder does not own stays, the indent is 2 spaces, the text ends with one line ending, the file's
 * own line ending is kept, and a second run changes nothing.
 */

import { describe, expect, it } from 'vitest';
import type { Contributes } from '../../src/toolbar/manifest';
import { withContributes } from '../../scripts/package-json-text';

const built: Contributes = {
  commands: [{ command: 'claudeToolbar.test', title: 'Test.', category: 'Claude Toolbar', icon: '$(add)' }],
  menus: { commandPalette: [{ command: 'claudeToolbar.test', when: 'false' }] },
  viewsContainers: { panel: [{ id: 'claudeToolbar-test', title: 'Test', icon: '$(add)' }] },
  views: { 'claudeToolbar-test': [{ type: 'webview', id: 'claudeToolbar.test', name: 'Test', icon: '$(add)' }] },
  configuration: { title: 'Claude Toolbar', properties: {} },
};

const before = '{\n  "name": "x",\n  "contributes": {\n    "keybindings": [],\n    "commands": []\n  },\n  "scripts": {}\n}\n';

describe('withContributes', () => {
  it('replaces the built keys and keeps every other field, and every other key of contributes, in its place', () => {
    const after = JSON.parse(withContributes(before, built)) as Record<string, Record<string, unknown>>;
    expect(Object.keys(after)).toEqual(['name', 'contributes', 'scripts']);
    expect(Object.keys(after.contributes)).toEqual(['keybindings', 'commands', 'menus', 'viewsContainers', 'views', 'configuration']);
    expect(after.contributes).toStrictEqual({ keybindings: [], ...built });
  });

  it('writes a 2-space indent and one final line ending, keeping the line ending of the file', () => {
    const lf = withContributes(before, built);
    const crlf = withContributes(before.replace(/\n/g, '\r\n'), built);
    expect(lf.startsWith('{\n  "name": "x",\n  "contributes": {\n    "keybindings": [],')).toBe(true);
    expect([lf.endsWith('}\n'), lf.includes('\r')]).toEqual([true, false]);
    expect(crlf).toBe(lf.replace(/\n/g, '\r\n'));
  });

  it('changes nothing on a second run', () => {
    const once = withContributes(before, built);
    expect(withContributes(once, built)).toBe(once);
  });
});
