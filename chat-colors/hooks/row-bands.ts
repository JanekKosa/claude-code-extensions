/**
 * The message render hooks (UserMessage, AssistantMessage). On a listed surface, while the kind's colour is set, a
 * row is drawn with a tinted band above it: the person's own prompts in the prompt colour, Claude's notes and
 * answers in theirs. Every other row is the engine's own drawing, unchanged.
 */
import type { On, PromptOrigin, RenderElement } from 'claude-code'

import type { CardColors } from '../types'
import { hashText } from '../utils/hash'
import { bandAbove } from './band'
import { readColors, readTextKind } from './chat-state'
import type { Settings } from './settings'

/**
 * The origins of a person's own prompt: typed at the terminal (`composer`), sent through Remote Control
 * (`bridge`), or typed into an SDK host's chat (`sdk`). Claude's VS Code chat names every prompt row it asks about
 * `sdk`, and asks only about the person's own. A task notification, another agent's or session's message and a
 * channel's message are none of these.
 */
const PROMPT_ORIGINS: readonly PromptOrigin['kind'][] = ['composer', 'bridge', 'sdk']

// ── Registering ──

/**
 * Registers the render hooks of the two message sites.
 *
 * @param on the module's registrar
 * @param settings the mod's options (surfaces, bandRows)
 * @returns nothing
 */
export function registerRowBands(on: On, settings: Settings): void {
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    if (!settings.surfaces.includes(e.surface) || !PROMPT_ORIGINS.includes(e.props.origin.kind)) {
      return next(e)
    }
    const colors = await readColors($)

    return withBand(await next(e), colors.prompt, colors, settings)
  })
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (!settings.surfaces.includes(e.surface)) {
      return next(e)
    }
    const colors = await readColors($)

    if (colors.notes === null && colors.answer === null) {
      return next(e)
    }
    const kind = e.props.isSummary === true ? 'note' : await readTextKind($, hashText(e.props.text.trim()))

    return withBand(await next(e), kind === 'answer' ? colors.answer : colors.notes, colors, settings)
  })
}

// ── Drawing ──

/**
 * Puts the band above a row's own drawing, or leaves the drawing alone while the kind has no colour.
 *
 * @param own the engine's own drawing of the row
 * @param color the kind's colour, or null for no band
 * @param colors the colours held (for the tint)
 * @param settings the mod's options (the band's height)
 * @returns the tree to draw
 */
function withBand(own: RenderElement, color: string | null, colors: CardColors, settings: Settings): RenderElement {
  return color === null ? own : bandAbove(own, { color, tintPercent: colors.tintPercent, rows: settings.bandRows })
}
