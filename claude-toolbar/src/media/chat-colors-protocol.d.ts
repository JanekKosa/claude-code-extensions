/**
 * The messages between the Chat colors page (chat-colors-page.ts, in the webview) and its logic in the extension
 * (panes\chat-colors\chat-colors-logic.ts). A declaration file, so that both sides share these types and neither
 * compiles them: tsconfig.webview.json builds the page, tsconfig.json the extension.
 */

/** The parts of the Claude chat whose color the pane sets. */
export type ChatPart = 'promptOutline' | 'thinkingLines';

/** One part, as the page shows it. */
export interface PartState {
  /** The part. */
  readonly part: ChatPart;
  /** The color the user's settings give it, as they hold it (such as `#4FA3E0`); null when they give none. */
  readonly color: string | null;
}

/** A typed text the logic did not save, because it is not a color. */
export interface RejectedColor {
  /** The part it was typed for. */
  readonly part: ChatPart;
  /** The text as typed. */
  readonly text: string;
}

/** The logic's one message to the page: everything the page shows. It answers every message of the page. */
export interface StateMessage {
  /** Always 'state'. */
  readonly type: 'state';
  /** The two parts, in the switch's order. */
  readonly parts: readonly PartState[];
  /** Set when the message answered saved a typed text that is not a color. */
  readonly rejected?: RejectedColor;
}

/**
 * The page's messages to the logic: `ready` (the page has loaded: send the state), `save` (save this color for a
 * part, from the wheel or typed into the hex field) and `useDefault` (remove the user's color: the theme's shows).
 */
export type PageMessage =
  | { readonly type: 'ready' }
  | { readonly type: 'save'; readonly part: ChatPart; readonly color: string }
  | { readonly type: 'useDefault'; readonly part: ChatPart };
