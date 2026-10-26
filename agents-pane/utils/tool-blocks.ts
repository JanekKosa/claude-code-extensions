/**
 * Reading the tool calls out of a stored response row's content blocks, as the Messages API spells them.
 */

/** One tool call of a response: its id, the tool's name and the input the model gave it. */
export type ToolCallBlock = {
  readonly id: string
  readonly name: string
  readonly input: Readonly<Record<string, unknown>>
}

/**
 * Picks the tool calls (`tool_use` blocks) out of a row's content, in order.
 *
 * @param content the row's content: a string (no tool calls) or a list of blocks
 * @returns the tool calls; empty when there are none
 */
export function toolCallBlocks(content: unknown): ToolCallBlock[] {
  if (!Array.isArray(content)) {
    return []
  }

  return content.filter(isToolCallBlock).map(block => ({
    id: block.id,
    name: block.name,
    input: isRecord(block.input) ? block.input : {},
  }))
}

/**
 * Tells a `tool_use` block from any other.
 *
 * @param block one content block
 * @returns true for a block with type `tool_use`, a string id and a string name
 */
function isToolCallBlock(block: unknown): block is { id: string; name: string; input: unknown } {
  return (
    isRecord(block) && block.type === 'tool_use' && typeof block.id === 'string' && typeof block.name === 'string'
  )
}

/**
 * Tells a plain object from anything else.
 *
 * @param value any value
 * @returns true for a non-null object that is not an array
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
