/**
 * Every tree the suite asserts, kept in one place as plain data. temp\chat-view\b1\chat-verdict.mjs imports this
 * file under Node too, so it holds plain data and erasable types only.
 */

/** What a tree means for its row: the chat drops it, the engine draws its own row, or the chat draws the tree. */
export type TreeMeaning = 'dropped' | 'engine' | 'visible'

/** A tree the verdict script runs through the chat's own code, with what it must come out as. */
export type VerdictTree = { readonly name: string; readonly tree: unknown; readonly meaning: TreeMeaning }

// ── The trees the suite asserts ──

/**
 * A hidden row exactly as the engine hands it back: the mod's empty Box (no child, no border, no background), with
 * the engine's mark of whose part of the drawing it is.
 */
export const HIDDEN_TREE = { type: 'Box', props: {}, children: [], part: { plugin: 'hide-actions' } } as const

/** What the tests' stand-in for the engine answers to `next(e)`: the engine's own drawing of the original props. */
export const ENGINE_TREE = { type: 'engine', ref: 0 } as const

// ── The verdict's set ──

/** The two trees above, and three controls that must stay visible, so the verdict shows it can fail. */
export const VERDICT_TREES: readonly VerdictTree[] = [
  { name: 'hidden row', tree: HIDDEN_TREE, meaning: 'dropped' },
  { name: 'engine drawing', tree: ENGINE_TREE, meaning: 'engine' },
  { name: 'control: border', tree: { type: 'Box', props: { borderStyle: 'single' }, children: [] }, meaning: 'visible' },
  { name: 'control: text', tree: { type: 'Box', props: {}, children: ['x'] }, meaning: 'visible' },
  { name: 'control: background', tree: { type: 'Box', props: { backgroundColor: 'gray' }, children: [] }, meaning: 'visible' },
]
