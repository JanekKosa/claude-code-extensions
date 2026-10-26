/**
 * Tests of utils/text-list.ts.
 */
import { expect, test } from 'claude-code/testing'

import { splitList } from '../../utils/text-list'

test('splitList trims each entry and drops empty ones', () => {
  expect(splitList(' vscode , desktop,,')).toEqual(['vscode', 'desktop'])
})

test('splitList of empty text is an empty list', () => {
  expect(splitList('')).toEqual([])
})
