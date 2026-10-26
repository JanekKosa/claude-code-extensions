/**
 * Tests hex colors in one form: a value normalized to `#RRGGBB` in upper case or rejected, and a typed text read
 * with spaces around it and the # left out.
 */

import { describe, expect, it } from 'vitest';
import { normalizedHexColor, typedHexColor } from '../../src/utils/hex-color';

describe('normalizedHexColor', () => {
  it.each([
    ['#4FA3E0', '#4FA3E0'],
    ['#4fa3e0', '#4FA3E0'],
    ['#00ff7F', '#00FF7F'],
  ])('gives %s as %s', (value, expected) => {
    expect(normalizedHexColor(value)).toBe(expected);
  });

  it.each(['', '#4FA3E', '#4FA3E00', '4FA3E0', '#4FA3EG', ' #4FA3E0', '#abc', 4, null, undefined])('gives null for %s', (value) => {
    expect(normalizedHexColor(value)).toBeNull();
  });
});

describe('typedHexColor', () => {
  it.each([
    ['#a1b2c3', '#A1B2C3'],
    ['a1b2c3', '#A1B2C3'],
    ['  #A1B2C3 ', '#A1B2C3'],
  ])('reads %s as %s', (text, expected) => {
    expect(typedHexColor(text)).toBe(expected);
  });

  it.each(['', ' ', 'blue', '##a1b2c3', '#a1b2c', 'a1b2c3d'])('reads "%s" as no color', (text) => {
    expect(typedHexColor(text)).toBeNull();
  });
});
