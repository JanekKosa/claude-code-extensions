/**
 * Tests of hooks/settings.ts: the options as the hooks use them.
 */
import { expect, test } from 'claude-code/testing'

import { settingsFrom } from '../../hooks/settings'

test('settingsFrom reads the number and splits both lists', () => {
  expect(settingsFrom({ pollMs: 750, surfaces: 'vscode, desktop', alwaysShow: '' })).toEqual({
    pollMs: 750,
    surfaces: ['vscode', 'desktop'],
    alwaysShow: [],
  })
})
