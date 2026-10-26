/**
 * Tests the context size: one text look per thousand from 0k to 1000k+, the 0k look also while the key is unset, a
 * size turned into the key's value by rounding and capping, and a click that does nothing.
 */

import { describe, expect, it } from 'vitest';
import { contextSizeButton, contextSizeLooks, contextSizeScale, contextSizeValue } from '../../src/buttons/context-size';
import { renderWhen } from '../../src/utils/when-clause';
import { FakeButtonHost } from '../helpers/fake-button-host';

describe('the context size', () => {
  it('has one look per thousand from 0k to 1000k+, each text without an icon', () => {
    const looks = contextSizeButton.looks;
    expect([contextSizeButton.id, looks.length, looks.filter((look) => look.icon !== undefined).length]).toEqual(['contextSize', 1001, 0]);
    expect([looks[0].tooltip, looks[212].tooltip, looks[1000].tooltip]).toEqual(['0k', '212k', '1000k+']);
  });

  it('shows the 0k look while the key is unset or 0, and every other look at its own value', () => {
    const looks = contextSizeLooks(5, 15);
    expect(looks.map((look) => [look.id, look.tooltip, renderWhen(look.when)])).toEqual([
      ['k0', '0k', "!claudeToolbar.contextK || claudeToolbar.contextK == '0'"],
      ['k5', '5k', "claudeToolbar.contextK == '5'"],
      ['k10', '10k', "claudeToolbar.contextK == '10'"],
      ['k15', '15k+', "claudeToolbar.contextK == '15'"],
    ]);
  });

  it('rounds a size to the step and caps it at the largest value; an unknown size is 0', () => {
    expect(contextSizeScale).toEqual({ stepK: 1, maxK: 1000 });
    expect([undefined, 0, 499, 500, 212_400, 999_600, 1_000_400, 1_800_000].map(contextSizeValue)).toEqual([0, 0, 0, 1, 212, 1000, 1000, 1000]);
  });

  it('does nothing on a click', async () => {
    const host = new FakeButtonHost();
    await contextSizeButton.looks[212].onClick(host);
    expect([host.commands, host.writes]).toEqual([[], []]);
  });
});
