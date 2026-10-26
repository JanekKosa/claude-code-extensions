/**
 * Tests of utils/: durations, text helpers and reading tool calls out of a row.
 */
import { expect, test } from 'claude-code/testing'

import { formatDuration } from '../../utils/duration'
import { optional } from '../../utils/lists'
import { formatTokens } from '../../utils/tokens'
import { baseName, firstLine, shorten } from '../../utils/text'
import { toolCallBlocks } from '../../utils/tool-blocks'

test('U1 a duration is written in its two largest units', () => {
  expect(formatDuration(-5)).toBe('0s')
  expect(formatDuration(9_400)).toBe('9s')
  expect(formatDuration(62_000)).toBe('1m 02s')
  expect(formatDuration(3_840_000)).toBe('1h 04m')
})

test('U1b a token count is written in thousands or millions', () => {
  expect(formatTokens(850)).toBe('850')
  expect(formatTokens(47_600)).toBe('48k')
  expect(formatTokens(999_600)).toBe('1.0M')
  expect(formatTokens(1_240_000)).toBe('1.2M')
})

test('U1c a missing value spreads to nothing', () => {
  expect(optional('high')).toEqual(['high'])
  expect(optional(null)).toEqual([])
})

test('U2 text helpers', () => {
  expect(firstLine('\n  \n  hello \nworld')).toBe('hello')
  expect(firstLine('')).toBe('')
  expect(shorten('abcdef', 6)).toBe('abcdef')
  expect(shorten('abcdefg', 6)).toBe('abcde…')
  expect(baseName('C:\\a\\b.ts')).toBe('b.ts')
  expect(baseName('/a/b/')).toBe('b')
  expect(baseName('plain')).toBe('plain')
})

test('U3 only tool_use blocks are read, an odd input as none', () => {
  const content = [
    { type: 'text', text: 'hi' },
    { type: 'tool_use', id: 't1', name: 'Read', input: { file_path: 'x' } },
    { type: 'tool_use', id: 't2', name: 'Bash', input: 'odd' },
    { type: 'tool_use', name: 'NoId' },
  ]

  expect(toolCallBlocks(content)).toEqual([
    { id: 't1', name: 'Read', input: { file_path: 'x' } },
    { id: 't2', name: 'Bash', input: {} },
  ])
  expect(toolCallBlocks('plain text')).toEqual([])
})
