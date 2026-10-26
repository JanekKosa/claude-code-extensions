/**
 * Tests the merge into the user's workbench.colorCustomizations: an empty setting, other keys kept, a block for one
 * theme kept, the key replaced, Default removing only that key, the setting left out when nothing is left, nothing
 * written when nothing changes, a setting that holds no object refused; and reading a part's color from the top level
 * only.
 */

import { describe, expect, it } from 'vitest';
import { customizedColor, withThemeColor } from '../../src/settings/color-customizations';

const outline = 'inlineChatInput.border';
const thinking = 'descriptionForeground';

/** A setting as a user may hold it: another color, a block for one theme holding the same key, and ours. */
const current = {
  'editor.background': '#1E1E1E',
  '[Default Dark Modern]': { [outline]: '#FF0000', 'sideBar.background': '#000000' },
  [outline]: '#111111',
};

describe('withThemeColor', () => {
  it('writes an object with only the color when the setting is not set', () => {
    expect(withThemeColor(undefined, outline, '#4FA3E0')).toStrictEqual({ changes: true, value: { [outline]: '#4FA3E0' } });
  });

  it('replaces the color in its place, and keeps every other key and the theme block exactly as they were', () => {
    const write = withThemeColor(current, outline, '#4FA3E0');
    expect(write).toStrictEqual({ changes: true, value: { ...current, [outline]: '#4FA3E0' } });
    expect(write.changes && write.value !== undefined && Object.keys(write.value)).toEqual(['editor.background', '[Default Dark Modern]', outline]);
    expect(write.changes && write.value?.['[Default Dark Modern]']).toBe(current['[Default Dark Modern]']);
  });

  it('adds a color the setting does not hold yet at the end, beside the others', () => {
    expect(withThemeColor(current, thinking, '#D29922')).toStrictEqual({ changes: true, value: { ...current, [thinking]: '#D29922' } });
  });

  it('removes only that color on Default: the other keys and the theme block stay', () => {
    expect(withThemeColor(current, outline, undefined)).toStrictEqual({
      changes: true,
      value: { 'editor.background': '#1E1E1E', '[Default Dark Modern]': current['[Default Dark Modern]'] },
    });
  });

  it('leaves the setting out entirely when Default leaves nothing in it', () => {
    expect(withThemeColor({ [thinking]: '#D29922' }, thinking, undefined)).toStrictEqual({ changes: true, value: undefined });
  });

  it.each([
    ['the same color again', { [outline]: '#4FA3E0' }, '#4FA3E0'],
    ['Default for a color not set', { 'editor.background': '#1E1E1E' }, undefined],
    ['Default while the setting is not set', undefined, undefined],
    ['Default while the setting is an empty object', {}, undefined],
  ])('writes nothing for %s', (_name, setting, color) => {
    expect(withThemeColor(setting, outline, color)).toStrictEqual({ changes: false });
  });

  it.each([null, 'blue', 5, ['#4FA3E0']])('refuses a setting holding %s, which a color cannot be merged into', (setting) => {
    expect(() => withThemeColor(setting, outline, '#4FA3E0')).toThrow('workbench.colorCustomizations in your user settings is not an object, so it was left as it is.');
  });
});

describe('customizedColor', () => {
  it('reads the color at the top level, as the setting holds it, and not the one of a theme block', () => {
    expect([customizedColor(current, outline), customizedColor({ [outline]: '#abc' }, outline)]).toEqual(['#111111', '#abc']);
  });

  it.each([
    ['the setting is not set', undefined],
    ['only a theme block holds it', { '[Monokai]': { [outline]: '#FF0000' } }],
    ['it is not text', { [outline]: 5 }],
    ['the setting is not an object', 'blue'],
  ])('gives null (theme default) when %s', (_name, setting) => {
    expect(customizedColor(setting, outline)).toBeNull();
  });
});
