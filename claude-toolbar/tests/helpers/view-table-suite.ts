/**
 * The checks of a view table and its button, as one vitest suite to run on any table: the derivation gives the
 * expected view for every combination of the settings the table selects by, and a click on each look writes
 * exactly the next view's settings at the Global level, after which the derivation gives that next view.
 */

import { describe, expect, it } from 'vitest';
import type { SettingValues } from '../../src/host/button-host';
import type { StateLook, ToolbarButton } from '../../src/toolbar/contracts';
import { deriveView, type ViewRow } from '../../src/toolbar/view-cycle';
import { FakeButtonHost } from './fake-button-host';

/** What a view table must do, written out independently of the table. */
export interface ViewTableExpectations {
  /** What the table is, for the test names. */
  readonly name: string;
  /** The table under test. */
  readonly table: readonly ViewRow[];
  /** The button built from it. */
  readonly button: ToolbarButton;
  /** The view expected for each combination of the settings the table selects by. */
  readonly derivation: readonly { readonly settings: SettingValues; readonly view: string }[];
  /** For each look: the view a click on it enters, and the settings that click writes. */
  readonly clicks: readonly { readonly look: string; readonly next: string; readonly writes: SettingValues }[];
}

/**
 * Declares the derivation and cycle checks of a view table.
 * @param expected the table, its button and what they must do
 */
export function describeViewTable(expected: ViewTableExpectations): void {
  describe(`${expected.name}: the derivation`, () => {
    it('is expected for every combination of the settings the table selects by', () => {
      const selecting = expected.table.flatMap((row) => (row.selectedBy === undefined ? [] : [row.selectedBy]));
      expect(expected.derivation).toHaveLength(2 ** selecting.length);
    });

    for (const { settings, view } of expected.derivation) {
      it(`gives ${view} for ${JSON.stringify(settings)}`, () => {
        expect(deriveView(expected.table, new FakeButtonHost(settings)).id).toBe(view);
      });
    }
  });

  describe(`${expected.name}: the cycle`, () => {
    it('has an expected click for every look', () => {
      expect(expected.clicks.map((click) => click.look).sort()).toEqual(expected.button.looks.map((look) => look.id).sort());
    });

    for (const { look, next, writes } of expected.clicks) {
      it(`a click on ${look} writes the settings of ${next} at the Global level`, async () => {
        const host = new FakeButtonHost();
        await lookById(expected.button, look).onClick(host);
        expect(host.writes).toStrictEqual([{ values: writes, target: 'global' }]);
        expect(deriveView(expected.table, host).id).toBe(next);
      });
    }
  });
}

/**
 * Finds a look of a button by its id.
 * @param button the button
 * @param lookId the look's id
 * @returns the look
 */
function lookById(button: ToolbarButton, lookId: string): StateLook {
  const look = button.looks.find((candidate) => candidate.id === lookId);
  if (look === undefined) throw new Error(`${button.id} has no look ${lookId}.`);
  return look;
}
