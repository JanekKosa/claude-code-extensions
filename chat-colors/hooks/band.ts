/**
 * The tree a coloured row is drawn as: a tinted band in the kind's colour, then the engine's own drawing of the row.
 *
 * Claude's VS Code chat (2.1.306) draws a mod's tree for a message row above the message and never around it: the
 * engine node in the tree draws nothing there, and the chat draws the message itself after the tree, as usual. So
 * the band stands on its own above the message, and the engine node stays in the tree so that the chat keeps its
 * own drawing of the message (a tree without one would replace the message's text). The terminal draws the
 * engine's row where the node stands: under the band, the same picture.
 */
import type { RenderElement } from 'claude-code'

import { withOpacity } from '../utils/hex-color'

/** The band's border: a thin line, with rounded corners where the surface draws them. */
const BAND_BORDER = 'round'

/** How a band is drawn: its colour, the tint of its background in percent, and its height in rows. */
export type BandStyle = { readonly color: string; readonly tintPercent: number; readonly rows: number }

// ── Drawing ──

/**
 * Draws a band above a row: a column whose first child is the band and whose second is the row's own drawing.
 *
 * @param own the engine's own drawing of the row (what `next(e)` resolved to)
 * @param style the band's colour, tint and height
 * @returns the tree
 */
export function bandAbove(own: RenderElement, style: BandStyle): RenderElement {
  return { type: 'Box', props: { flexDirection: 'column' }, children: [band(style), own] }
}

/**
 * Draws the band: an empty Box of `rows` rows with a thin border in the colour and the colour at the tint behind.
 *
 * @param style the band's colour, tint and height
 * @returns the band's Box
 */
function band(style: BandStyle): RenderElement {
  return {
    type: 'Box',
    props: {
      height: style.rows,
      borderStyle: BAND_BORDER,
      borderColor: style.color,
      backgroundColor: withOpacity(style.color, style.tintPercent),
    },
    children: [],
  }
}
