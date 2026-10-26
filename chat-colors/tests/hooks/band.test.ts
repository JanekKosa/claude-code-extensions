/**
 * Tests of hooks/band.ts: the tree of a banded row, its colours, its tint and its height.
 */
import { expect, test } from 'claude-code/testing'

import { bandAbove } from '../../hooks/band'
import { ALPHA, COLOR, ENGINE_TREE } from '../fixtures/trees'

/**
 * The band (the column's first child) of a tree `bandAbove` drew.
 *
 * @param tint the tint in percent
 * @param rows the band's height
 * @returns the band's Box, or undefined when the tree holds no children
 */
function bandOf(tint: number, rows = 1): unknown {
  const tree = bandAbove(ENGINE_TREE, { color: COLOR.answer, tintPercent: tint, rows })

  return 'children' in tree ? tree.children?.[0] : undefined
}

test('T1 the band stands above the row own drawing, in a column', () => {
  expect(bandAbove(ENGINE_TREE, { color: COLOR.prompt, tintPercent: 15, rows: 1 })).toStrictEqual({
    type: 'Box',
    props: { flexDirection: 'column' },
    children: [
      {
        type: 'Box',
        props: { height: 1, borderStyle: 'round', borderColor: COLOR.prompt, backgroundColor: `${COLOR.prompt}26` },
        children: [],
      },
      ENGINE_TREE,
    ],
  })
})

test('T2 the tint is the colour alpha byte: 0 clear, 15 percent 26, 100 solid', () => {
  expect(bandOf(0)).toMatchObject({ props: { backgroundColor: `${COLOR.answer}${ALPHA.clear}` } })
  expect(bandOf(15)).toMatchObject({ props: { backgroundColor: `${COLOR.answer}${ALPHA.default}` } })
  expect(bandOf(100)).toMatchObject({ props: { backgroundColor: `${COLOR.answer}${ALPHA.solid}` } })
})

test('T3 the border is the colour itself, whatever the tint', () => {
  expect(bandOf(0)).toMatchObject({ props: { borderColor: COLOR.answer } })
  expect(bandOf(100)).toMatchObject({ props: { borderColor: COLOR.answer } })
})

test('T4 the band is as many rows high as asked', () => {
  expect(bandOf(15, 3)).toMatchObject({ props: { height: 3 } })
})
