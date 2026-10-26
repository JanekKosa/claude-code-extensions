/**
 * Tests the write-settings action: it writes exactly the given values, once, at the user (Global) level.
 */

import { describe, expect, it } from 'vitest';
import { writeSettings } from '../../src/actions/write-settings';
import { FakeButtonHost } from '../helpers/fake-button-host';

describe('writeSettings', () => {
  it('writes exactly the given values at the Global level', async () => {
    const host = new FakeButtonHost({ 'test.kept': 'as it was' });
    await writeSettings({ 'test.on': true, 'test.count': 2 })(host);
    expect(host.writes).toStrictEqual([{ values: { 'test.on': true, 'test.count': 2 }, target: 'global' }]);
    expect(['test.on', 'test.count', 'test.kept'].map((key) => host.readSetting(key))).toEqual([true, 2, 'as it was']);
  });
});
