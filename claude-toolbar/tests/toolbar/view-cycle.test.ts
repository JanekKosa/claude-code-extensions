/**
 * Tests the view-table machinery on small made-up tables: each look's condition, and what happens when a table
 * breaks its rules (a missing next view, a last row that selects by a setting).
 */

import { describe, expect, it } from 'vitest';
import { deriveView, type ViewRow, viewCycleButton } from '../../src/toolbar/view-cycle';
import { renderWhen } from '../../src/utils/when-clause';
import { FakeButtonHost } from '../helpers/fake-button-host';

/**
 * Builds a row with a made-up look.
 * @param id the view's id
 * @param next the next view's id
 * @param selectedBy the selecting setting, if any
 * @returns the row
 */
function row(id: string, next: string, selectedBy?: string): ViewRow {
  return { id, icon: 'circle', tooltip: `View ${id}.`, selectedBy, writes: { [`test.${id}`]: true }, next };
}

describe('viewCycleButton', () => {
  it("shows each look when no earlier row's setting is on and its own is", () => {
    const button = viewCycleButton('test', [row('first', 'second', 'test.a'), row('second', 'third', 'test.b'), row('third', 'first')]);
    expect(button.looks.map((look) => renderWhen(look.when))).toEqual([
      'config.test.a',
      '!config.test.a && config.test.b',
      '!config.test.a && !config.test.b',
    ]);
  });

  it('rejects a click whose next view is not in the table, naming that view', async () => {
    const button = viewCycleButton('test', [row('first', 'missing', 'test.a'), row('second', 'first')]);
    await expect(button.looks[0].onClick(new FakeButtonHost())).rejects.toThrow(/no view missing/);
  });
});

describe('deriveView', () => {
  it('throws when no row matches because the last row selects by a setting', () => {
    expect(() => deriveView([row('first', 'first', 'test.a')], new FakeButtonHost())).toThrow(/No view matches/);
  });
});
