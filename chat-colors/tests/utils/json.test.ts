/**
 * Tests of utils/json.ts.
 */
import { expect, test } from 'claude-code/testing'

import { isJsonObject, parseJson } from '../../utils/json'

test('parseJson answers the value of valid JSON', () => {
  expect(parseJson('{"a":1}')).toEqual({ isJson: true, value: { a: 1 } })
})

test('parseJson answers isJson false for text that is not JSON', () => {
  expect(parseJson('{"a":')).toEqual({ isJson: false })
})

test('isJsonObject is true only for an object', () => {
  expect([{}, [], null, 1, 'x', true].map(isJsonObject)).toEqual([true, false, false, false, false, false])
})
