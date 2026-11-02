/**
 * Pins the settings the toolbar owns: the context size's refresh time and bytes read, the three band colors and the
 * band tint, which package.json declares under "Claude Toolbar"; and nothing of view 2.
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
  it("are the context size's two and the bands' four, and package.json declares exactly them under \"Claude Toolbar\"", () => {
    expect([ownedSettings.map((owned) => [owned.key, owned.default]), configuration]).toStrictEqual([
      [
        ['claudeToolbar.contextRefreshMs', 1000],
        ['claudeToolbar.contextTailBytes', 4_194_304],
        ['claudeToolbar.promptBandColor', ''],
        ['claudeToolbar.notesBandColor', ''],
        ['claudeToolbar.answerBandColor', ''],
        ['claudeToolbar.bandTintPercent', 15],
      ],
      {
        title: 'Claude Toolbar',
        properties: Object.fromEntries(
          ownedSettings.map((owned) => [owned.key, { type: typeof owned.default, default: owned.default, description: owned.description, scope: 'application' }]),
        ),
      },
    ]);
  });

  it('leave nothing of view 2 in package.json: no hideActions, no hide-actions mod', () => {
    expect([packageJsonText.includes('hideActions'), packageJsonText.includes('hide-actions')]).toEqual([false, false]);
  });
});
