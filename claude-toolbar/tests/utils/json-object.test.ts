/**
 * Tests the JSON object helpers: what counts as an object, and a copy with one key set or removed that keeps every
 * other key, its value and its place, and leaves the original as it was.
 */

import { describe, expect, it } from 'vitest';
import { isJsonObject, withKey } from '../../src/utils/json-object';

describe('isJsonObject', () => {
  it('is true for an object and false for null, an array, text and a number', () => {
    expect([{}, null, [], 'text', 1].map(isJsonObject)).toEqual([true, false, false, false, false]);
  });
});

describe('withKey', () => {
  const object = { first: 1, middle: { inner: true }, last: 'x' };

  it('replaces a key in its place and keeps the other values themselves', () => {
    const changed = withKey(object, 'middle', 2);
    expect([Object.entries(changed), changed.last === object.last]).toStrictEqual([
      [
        ['first', 1],
        ['middle', 2],
        ['last', 'x'],
      ],
      true,
    ]);
  });

  it('adds a new key at the end', () => {
    expect(Object.keys(withKey(object, 'added', 0))).toEqual(['first', 'middle', 'last', 'added']);
  });

  it('removes a key for undefined, and leaves the original as it was', () => {
    expect([withKey(object, 'first', undefined), object]).toStrictEqual([
      { middle: { inner: true }, last: 'x' },
      { first: 1, middle: { inner: true }, last: 'x' },
    ]);
  });

  it('ignores keys of the prototype: toString is not a key of {}', () => {
    expect(withKey({}, 'toString', undefined)).toStrictEqual({});
  });
});
