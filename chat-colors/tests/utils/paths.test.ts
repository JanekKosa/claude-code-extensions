/**
 * Tests of utils/paths.ts.
 */
import { expect, test } from 'claude-code/testing'

import { joinUnder } from '../../utils/paths'

test("joinUnder keeps a Windows folder's backslashes", () => {
  expect(joinUnder('C:\\Users\\jan', ['.claude', 'x.json'])).toBe('C:\\Users\\jan\\.claude\\x.json')
})

test("joinUnder keeps a POSIX folder's slashes", () => {
  expect(joinUnder('/home/jan', ['.claude', 'x.json'])).toBe('/home/jan/.claude/x.json')
})

test('joinUnder drops a trailing separator of the folder', () => {
  expect(joinUnder('C:\\Users\\jan\\', ['x.json'])).toBe('C:\\Users\\jan\\x.json')
})
