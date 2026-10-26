/**
 * The checks every toolbar button must pass, as one vitest suite to run on any list of buttons: unique camelCase
 * ids, a tooltip on every look, real codicons on the looks that have one, only settings the toolbar owns or Claude's extension names, and
 * exactly one look showing for every combination of the settings the looks' conditions read.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { claudeExtension } from '../../src/host/claude-extension';
import type { OwnedSetting, StateLook, ToolbarButton } from '../../src/toolbar/contracts';
import { FakeButtonHost } from './fake-button-host';
import { codiconTablePath } from './paths';
import { candidateValues, combinations, evaluateWhen } from './when-clause-eval';

/** A camelCase id: a lower-case letter, then letters and digits. */
const camelCase = /^[a-z][a-zA-Z0-9]*$/;

/** The prefix under which a when-clause reads a setting. */
const settingPrefix = 'config.';

// ---------------------------------------------------------------------------------------------------------------
// The suite
// ---------------------------------------------------------------------------------------------------------------

/**
 * Declares the validity checks for a list of buttons.
 * @param name what the buttons are, for the test names
 * @param buttons the buttons, in toolbar order
 * @param ownedSettings the settings the toolbar owns
 */
export function describeButtonValidity(name: string, buttons: readonly ToolbarButton[], ownedSettings: readonly OwnedSetting[]): void {
  describe(`${name}: every button is valid`, () => {
    it('gives every button a unique camelCase id', () => {
      expect(idProblems(buttons.map((button) => button.id))).toEqual([]);
    });

    it('gives the looks of each button unique camelCase ids', () => {
      expect(buttons.flatMap((button) => idProblems(button.looks.map((look) => look.id)).map((problem) => `${button.id}: ${problem}`))).toEqual([]);
    });

    it('gives every look a tooltip', () => {
      expect(namedLooks(buttons).filter(({ look }) => look.tooltip.trim() === '').map(({ name: lookName }) => lookName)).toEqual([]);
    });

    it('uses only real codicons (a look without an icon shows as text)', () => {
      const codicons = readCodiconNames();
      const unknown = namedLooks(buttons).filter(({ look }) => look.icon !== undefined && !codicons.has(look.icon));
      expect(unknown.map(({ name: lookName, look }) => `${lookName}: ${look.icon}`)).toEqual([]);
    });

    it("reads and writes only settings the toolbar owns or Claude's extension names", async () => {
      const known = new Set([...ownedSettings.map((owned) => owned.key), ...Object.values(claudeExtension.booleanSettings)]);
      const used = [...settingsRead(buttons), ...(await settingsWritten(buttons))];
      expect(used.filter((key) => !known.has(key))).toEqual([]);
    });

    it('shows exactly one look of each button for every combination of the settings its looks read', () => {
      expect(buttons.flatMap(coverageProblems)).toEqual([]);
    });
  });
}

// ---------------------------------------------------------------------------------------------------------------
// The checks
// ---------------------------------------------------------------------------------------------------------------

/**
 * Finds ids that are not camelCase or are used more than once.
 * @param ids the ids
 * @returns one line per problem
 */
function idProblems(ids: readonly string[]): string[] {
  const notCamelCase = ids.filter((id) => !camelCase.test(id)).map((id) => `${id} is not camelCase`);
  const repeated = ids.filter((id, index) => ids.indexOf(id) !== index).map((id) => `${id} is used twice`);
  return [...notCamelCase, ...repeated];
}

/**
 * Lists every setting the looks' conditions read.
 * @param buttons the buttons
 * @returns the settings' full keys
 */
function settingsRead(buttons: readonly ToolbarButton[]): string[] {
  const keys = [...candidateValues(namedLooks(buttons).map(({ look }) => look.when)).keys()];
  return keys.filter((key) => key.startsWith(settingPrefix)).map((key) => key.slice(settingPrefix.length));
}

/**
 * Lists every setting a click on any look writes, by clicking each look on a fake host.
 * @param buttons the buttons
 * @returns the settings' full keys
 */
async function settingsWritten(buttons: readonly ToolbarButton[]): Promise<string[]> {
  const written: string[] = [];
  for (const { look } of namedLooks(buttons)) {
    const host = new FakeButtonHost();
    await look.onClick(host);
    written.push(...host.writes.flatMap((write) => Object.keys(write.values)));
  }
  return written;
}

/**
 * Finds the combinations of a button's settings in which not exactly one of its looks shows.
 * @param button the button
 * @returns one line per such combination
 */
function coverageProblems(button: ToolbarButton): string[] {
  return combinations(candidateValues(button.looks.map((look) => look.when))).flatMap((context) => {
    const shown = button.looks.filter((look) => evaluateWhen(look.when, context)).map((look) => look.id);
    return shown.length === 1 ? [] : [`${button.id}: ${shown.length} looks show (${shown.join(', ')}) when ${JSON.stringify(context)}`];
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------------------------------------------

/**
 * Lists every look with a name for messages.
 * @param buttons the buttons
 * @returns each look with its name `<buttonId>.<lookId>`
 */
function namedLooks(buttons: readonly ToolbarButton[]): { readonly name: string; readonly look: StateLook }[] {
  return buttons.flatMap((button) => button.looks.map((look) => ({ name: `${button.id}.${look.id}`, look })));
}

/**
 * Reads the names of every codicon from the codicon table of @vscode/codicons.
 * @returns the names (the column `short_name`)
 */
function readCodiconNames(): Set<string> {
  const [header, ...rows] = readFileSync(codiconTablePath, 'utf8').split(/\r?\n/);
  const column = header.split(',').indexOf('short_name');
  if (column < 0) throw new Error(`${codiconTablePath} has no short_name column.`);
  return new Set(rows.filter((row) => row !== '').map((row) => row.split(',')[column]));
}
