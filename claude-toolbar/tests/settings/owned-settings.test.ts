/**
 * Pins the settings the toolbar owns: the context size's refresh time and bytes read, which package.json declares
 * under "Claude Toolbar"; nothing of
 * the band colors, their tint or the chat-view file's retries is left in package.json; and nothing of view 2.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ownedSettings } from '../../src/settings/owned-settings';
import { packageJsonPath } from '../helpers/paths';

/** package.json as text. */
const packageJsonText = readFileSync(packageJsonPath, 'utf8');

/** The configuration package.json declares. */
const configuration = (JSON.parse(packageJsonText) as { contributes: { configuration: unknown } }).contributes.configuration;

describe('the owned settings', () => {
  it("are the context size's two, and package.json declares exactly them under \"Claude Toolbar\"", () => {
    expect([ownedSettings.map((owned) => [owned.key, owned.default]), configuration]).toStrictEqual([
      [
        ['claudeToolbar.contextRefreshMs', 1000],
        ['claudeToolbar.contextTailBytes', 4_194_304],
      ],
      {
        title: 'Claude Toolbar',
        properties: Object.fromEntries(
          ownedSettings.map((owned) => [owned.key, { type: 'number', default: owned.default, description: owned.description, scope: 'application' }]),
        ),
      },
    ]);
  });

  it('leave nothing of the bands in package.json: no band colors, tint, chat-view file or retry settings', () => {
    const removed = ['claudeToolbar.colors', 'tintPercent', 'chatViewFile', 'chat-view file', 'band'];
    expect(removed.filter((text) => packageJsonText.includes(text))).toEqual([]);
  });

  it('leave nothing of view 2 in package.json: no hideActions, no hide-actions mod', () => {
    expect([packageJsonText.includes('hideActions'), packageJsonText.includes('hide-actions')]).toEqual([false, false]);
  });
});
