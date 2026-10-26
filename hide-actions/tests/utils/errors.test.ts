/**
 * Tests of utils/errors.ts.
 */
import { expect, test } from 'claude-code/testing'

import { namesErrno } from '../../utils/errors'

test('namesErrno finds the errno named in the message', () => {
  expect(namesErrno(new Error("hide-actions: $.fs.read: ENOENT: no such file or directory, open 'C:\\x'"), 'ENOENT')).toBe(true)
})

test('namesErrno is false for another errno or a longer word', () => {
  expect(namesErrno(new Error('EBUSY: resource busy or locked'), 'ENOENT')).toBe(false)
  expect(namesErrno(new Error('ENOENTS'), 'ENOENT')).toBe(false)
})

test('namesErrno reads a rejection that is not an Error', () => {
  expect(namesErrno('ENOENT: gone', 'ENOENT')).toBe(true)
})
