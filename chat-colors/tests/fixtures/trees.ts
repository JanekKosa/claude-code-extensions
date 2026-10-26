/**
 * Every tree the suite asserts, kept in one place as plain data. temp\chat-view\m1\chat-verdict.mjs imports this
 * file under Node too, so it holds plain data, plain functions and erasable types only, and imports nothing.
 */

/**
 * What a tree means for a message row in Claude's VS Code chat: a band drawn above the message the chat draws
 * itself, the chat's own drawing alone, or a tree that replaces the message's text.
 */
export type TreeMeaning = 'band' | 'engine' | 'replaces'

/** A tree the verdict script runs through the chat's own code, with what it must come out as. */
export type VerdictTree = {
  readonly name: string
  readonly tree: unknown
  readonly meaning: TreeMeaning
  /** For a band: the colour, the alpha byte and the rows its first child must be drawn with. */
  readonly band?: { readonly color: string; readonly alpha: string; readonly rows: number }
}

// ── The colours and tints the suite uses ──

/** The colours the tests' bridge file names. */
export const COLOR = { prompt: '#4FA3E0', notes: '#D29922', answer: '#3FB950' } as const

/** The alpha byte each tint the suite uses comes to: 0 percent clear, 15 percent `26`, 100 percent solid. */
export const ALPHA = { clear: '00', default: '26', solid: 'FF' } as const

// ── The trees ──

/** What the tests' stand-in for the engine answers to `next(e)`: the engine's own drawing of the original props. */
export const ENGINE_TREE = { type: 'engine', ref: 0 } as const

/**
 * A banded row exactly as the engine hands it back: a column of the band and the engine's own drawing, with the
 * engine's mark of whose part of the drawing it is on the root.
 *
 * @param color the band's colour, `#RRGGBB`
 * @param alpha the alpha byte of its background, two hex digits
 * @param rows the band's height in rows
 * @returns the tree
 */
export function bandTree(color: string, alpha: string, rows = 1) {
  return {
    type: 'Box',
    props: { flexDirection: 'column' },
    children: [
      {
        type: 'Box',
        props: { height: rows, borderStyle: 'round', borderColor: color, backgroundColor: `${color}${alpha}` },
        children: [],
      },
      ENGINE_TREE,
    ],
    part: { plugin: 'chat-colors' },
  }
}

// ── The verdict's set ──

/** Each kind's band, the tints 0 and 100, a taller band, the engine's own drawing, and two controls. */
export const VERDICT_TREES: readonly VerdictTree[] = [
  bandEntry('prompt band, tint 15', COLOR.prompt, ALPHA.default, 1),
  bandEntry('note band, tint 15', COLOR.notes, ALPHA.default, 1),
  bandEntry('answer band, tint 15', COLOR.answer, ALPHA.default, 1),
  bandEntry('answer band, tint 0', COLOR.answer, ALPHA.clear, 1),
  bandEntry('answer band, tint 100', COLOR.answer, ALPHA.solid, 1),
  bandEntry('answer band, 3 rows', COLOR.answer, ALPHA.default, 3),
  { name: 'engine drawing', tree: ENGINE_TREE, meaning: 'engine' },
  {
    name: 'control: a card holding its own text',
    tree: { type: 'Box', props: { borderStyle: 'round' }, children: ['Done.'] },
    meaning: 'replaces',
  },
  { name: 'control: an empty box', tree: { type: 'Box', props: {}, children: [] }, meaning: 'replaces' },
]

/**
 * One band of the verdict's set.
 *
 * @param name what the line is called
 * @param color the band's colour
 * @param alpha the alpha byte of its background
 * @param rows its height in rows
 * @returns the entry
 */
function bandEntry(name: string, color: string, alpha: string, rows: number): VerdictTree {
  return { name, tree: bandTree(color, alpha, rows), meaning: 'band', band: { color, alpha, rows } }
}
