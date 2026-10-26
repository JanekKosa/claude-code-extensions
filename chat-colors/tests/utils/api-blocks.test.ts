/**
 * Tests of utils/api-blocks.ts.
 */
import { expect, test } from 'claude-code/testing'

import { isToolCallBlock, trimmedTextOf } from '../../utils/api-blocks'

test('isToolCallBlock is true for the three tool call kinds alone', () => {
  const kinds = ['tool_use', 'server_tool_use', 'mcp_tool_use', 'text', 'thinking', 'tool_result', 'image']

  expect(kinds.map(type => isToolCallBlock({ type }))).toEqual([true, true, true, false, false, false, false])
})

test('trimmedTextOf reads a text block trimmed', () => {
  expect(trimmedTextOf({ type: 'text', text: '\n Done. \n' })).toBe('Done.')
})

test('trimmedTextOf is undefined for a blank text and for any other block', () => {
  expect([
    trimmedTextOf({ type: 'text', text: '  ' }),
    trimmedTextOf({ type: 'text' }),
    trimmedTextOf({ type: 'thinking', thinking: 'hm' }),
    trimmedTextOf({ type: 'tool_use', text: 'not a text block' }),
  ]).toEqual([undefined, undefined, undefined, undefined])
})
