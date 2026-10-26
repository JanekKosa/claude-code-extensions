/**
 * Generic helpers: reading the content blocks of a message as the Messages API spells them.
 */

/** The block kinds that are a tool call: the client's own, the API's server tools, and the MCP connector's. */
const TOOL_CALL_BLOCKS: readonly string[] = ['tool_use', 'server_tool_use', 'mcp_tool_use']

/** A content block: its kind, and that kind's fields. */
export type ContentBlock = { readonly type: string; readonly [field: string]: unknown }

/**
 * Tells whether a block is a tool call.
 *
 * @param block a content block
 * @returns true for a `tool_use`, `server_tool_use` or `mcp_tool_use` block
 */
export function isToolCallBlock(block: ContentBlock): boolean {
  return TOOL_CALL_BLOCKS.includes(block.type)
}

/**
 * Reads the text of a text block, trimmed.
 *
 * @param block a content block
 * @returns the text, trimmed; undefined for any other block and for a text that is blank
 */
export function trimmedTextOf(block: ContentBlock): string | undefined {
  const text = block.type === 'text' && typeof block.text === 'string' ? block.text.trim() : ''

  return text === '' ? undefined : text
}
