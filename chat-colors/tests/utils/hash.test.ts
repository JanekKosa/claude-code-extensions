/**
 * Tests of utils/hash.ts.
 */
import { expect, test } from 'claude-code/testing'

import { hashText } from '../../utils/hash'

test('hashText is the same for the same text', () => {
  expect(hashText('All 12 tests pass.')).toBe(hashText('All 12 tests pass.'))
})

test('hashText differs for texts that differ by one character', () => {
  const keys = ['Done.', 'Done!', 'done.', 'Done. ', ''].map(hashText)

  expect(new Set(keys).size).toBe(keys.length)
})

test('hashText is up to 11 lowercase letters and digits', () => {
  expect(hashText('x'.repeat(100_000))).toMatch(/^[0-9a-z]{1,11}$/)
})
