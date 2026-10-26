/**
 * The bridge file's exact texts as the Claude toolbar writes them, one per write, in the order written: the first
 * write into a missing folder (every setting at its default), then claudeToolbar.hideActions true, then false.
 *
 * Generated 2026-10-23 19:13:40 by temp\chat-view\b2\toolbar-bytes.ts, which ran the toolbar's own writer
 * (claude-toolbar\src\bridge\bridge-writer.ts, startBridgeWriter, with utils\atomic-write.ts) against a temp home
 * folder and read each file once after its write had settled. Regenerate it with that script; never edit it by
 * hand. The bytes read, with no byte-order mark (EF BB BF) in front:
 * - first write into a missing folder: 22 bytes, 7B 22 68 69 64 65 41 63 74 69 6F 6E 73 22 3A 66 61 6C 73 65 7D 0A
 * - hideActions true: 21 bytes, 7B 22 68 69 64 65 41 63 74 69 6F 6E 73 22 3A 74 72 75 65 7D 0A
 * - hideActions false: 22 bytes, 7B 22 68 69 64 65 41 63 74 69 6F 6E 73 22 3A 66 61 6C 73 65 7D 0A
 */

/** One write of the bridge file: its name, what the toolbar meant (its hideActions setting), the exact text. */
export type ToolbarText = { readonly write: string; readonly hideActions: boolean; readonly text: string }

/** The texts, in the order the toolbar wrote them. */
export const TOOLBAR_TEXTS: readonly ToolbarText[] = [
  { write: "first write into a missing folder", hideActions: false, text: "{\"hideActions\":false}\n" },
  { write: "hideActions true", hideActions: true, text: "{\"hideActions\":true}\n" },
  { write: "hideActions false", hideActions: false, text: "{\"hideActions\":false}\n" },
]
