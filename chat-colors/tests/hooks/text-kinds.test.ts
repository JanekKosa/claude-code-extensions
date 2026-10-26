/**
 * Tests of hooks/text-kinds.ts: notes and answers in a transcript read whole.
 */
import { expect, test } from 'claude-code/testing'

import { kindsOfTranscript } from '../../hooks/text-kinds'
import { hashText } from '../../utils/hash'
import { claudeTextRow, promptRow, toolCallRow, toolResultRow } from '../support/chat-session'

/**
 * The kinds as a plain object keyed by text, for readable failures.
 *
 * @param kinds what kindsOfTranscript answered
 * @param texts the texts to look up
 * @returns each text's kind, or undefined
 */
function byText(kinds: Map<string, string>, texts: readonly string[]) {
  return Object.fromEntries(texts.map(text => [text, kinds.get(hashText(text))]))
}

test('K1 a turn with tool calls: the texts a tool call follows are notes, the last text the answer', () => {
  const kinds = kindsOfTranscript([
    promptRow('Fix the build'),
    claudeTextRow('Let me look.'),
    toolCallRow('Read'),
    toolResultRow('Read'),
    claudeTextRow('Fixed.'),
  ])

  expect(byText(kinds, ['Let me look.', 'Fixed.'])).toEqual({ 'Let me look.': 'note', 'Fixed.': 'answer' })
})

test('K2 a turn without tool calls: its text is the answer', () => {
  expect(byText(kindsOfTranscript([promptRow('Hi'), claudeTextRow('Hello.')]), ['Hello.'])).toEqual({ 'Hello.': 'answer' })
})

test('K3 a prompt ends the turn before it', () => {
  const kinds = kindsOfTranscript([
    promptRow('One'),
    claudeTextRow('First answer.'),
    promptRow('Two'),
    claudeTextRow('Second note.'),
    toolCallRow('Bash'),
    toolResultRow('Bash'),
  ])

  expect(byText(kinds, ['First answer.', 'Second note.'])).toEqual({ 'First answer.': 'answer', 'Second note.': 'note' })
})

test('K4 two texts after the last tool call are both the answer', () => {
  const kinds = kindsOfTranscript([promptRow('Go'), toolCallRow('Read'), toolResultRow('Read'), claudeTextRow('A.'), claudeTextRow('B.')])

  expect(byText(kinds, ['A.', 'B.'])).toEqual({ 'A.': 'answer', 'B.': 'answer' })
})

test('K5 a repeated text takes the later kind', () => {
  const kinds = kindsOfTranscript([
    promptRow('One'),
    claudeTextRow('Done.'),
    promptRow('Two'),
    claudeTextRow('Done.'),
    toolCallRow('Bash'),
  ])

  expect(byText(kinds, ['Done.'])).toEqual({ 'Done.': 'note' })
})

test('K6 blank texts are left out, and the key is the text trimmed', () => {
  const kinds = kindsOfTranscript([promptRow('Go'), claudeTextRow('  '), claudeTextRow('\nAll good.\n')])

  expect([...kinds.keys()]).toEqual([hashText('All good.')])
  expect(kinds.get(hashText('All good.'))).toBe('answer')
})

test('K7 an empty transcript has no kinds', () => {
  expect(kindsOfTranscript([]).size).toBe(0)
})
