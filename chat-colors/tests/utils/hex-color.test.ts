/**
 * Tests of utils/hex-color.ts.
 */
import { expect, test } from 'claude-code/testing'

import { isHexColor, withOpacity } from '../../utils/hex-color'

test('isHexColor is true for # and six hex digits of either case', () => {
  expect(['#4FA3E0', '#a1b2c3', '#000000'].map(isHexColor)).toEqual([true, true, true])
})

test('isHexColor is false for every other value', () => {
  expect(['#4FA', '#4FA3E0FF', '4FA3E0', '#4FA3EG', ' #4FA3E0', 'red', 7, null, undefined].map(isHexColor)).toEqual(
    Array(9).fill(false),
  )
})

test('withOpacity appends the alpha byte, rounded, in upper case', () => {
  expect([0, 15, 50, 100].map(percent => withOpacity('#4FA3E0', percent))).toEqual([
    '#4FA3E000',
    '#4FA3E026',
    '#4FA3E080',
    '#4FA3E0FF',
  ])
})
