/**
 * The chat-colors mod's contract: the `$.state` values it owns.
 *
 * `colors` is what the bridge file says now; the bridge poll writes it and every row that can get a card reads it.
 * `kinds` holds one member per text of Claude's (keyed by the text's hash): note or answer. `pending` lists the
 * texts of the running turn that no tool call has followed yet; the turn's end makes them the answer. The contract
 * imports nothing (validate refuses an import): `StateFamily` is named inside the augmentation of 'claude-code'.
 */

/** The cards' colours as the bridge file names them: `#RRGGBB`, or null for no card of that kind; the tint in percent. */
export type CardColors = {
  readonly prompt: string | null
  readonly notes: string | null
  readonly answer: string | null
  readonly tintPercent: number
}

/** What a text block of Claude's is: a note (a tool call follows it, or its turn still runs) or the answer. */
export type TextKind = 'note' | 'answer'

declare module 'claude-code' {
  interface PluginState {
    'chat-colors': {
      colors: CardColors
      kinds: StateFamily<TextKind>
      pending: string[]
    }
  }
}
