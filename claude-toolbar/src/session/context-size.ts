/**
 * Reads a chat's context size from the end of its transcript. Every answer step of Claude's is an `assistant` record
 * carrying `usage`; its input, cache-creation and cache-read tokens add up to what the context held. A turn stopped
 * by the usage limit or an API error writes such a record with every number at zero, so zero records are skipped.
 */

import { isJsonObject, type JsonObject } from '../utils/json-object';

/** The usage fields that add up to the context size. */
const contextFields = ['input_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'] as const;

/**
 * Finds the latest context size in the end of a transcript. The first line may be cut where the read began; a line
 * that is not a whole JSON record is skipped.
 * @param tail the text of the transcript's end, one JSON record per line
 * @returns the size in tokens, or undefined when the text holds no record with a size above zero
 */
export function lastContextSize(tail: string): number | undefined {
  const lines = tail.split('\n');
  for (let index = lines.length - 1; index >= 0; index--) {
    const size = contextSizeOf(lines[index]);
    if (size !== undefined && size > 0) return size;
  }
  return undefined;
}

/**
 * Reads the context size of one transcript line.
 * @param line the line
 * @returns the sum of its usage fields when it is the main chat's assistant record; else undefined
 */
function contextSizeOf(line: string): number | undefined {
  if (!line.includes('"usage"')) return undefined;
  const record = parsedRecord(line);
  if (record?.type !== 'assistant' || record.isSidechain === true || !isJsonObject(record.message)) return undefined;
  const usage = record.message.usage;
  if (!isJsonObject(usage)) return undefined;
  return contextFields.reduce((sum, field) => {
    const tokens = usage[field];
    return sum + (typeof tokens === 'number' ? tokens : 0);
  }, 0);
}

/**
 * Parses a line as a JSON object.
 * @param line the line
 * @returns the object, or undefined when the line is not one
 */
function parsedRecord(line: string): JsonObject | undefined {
  try {
    const parsed: unknown = JSON.parse(line);
    return isJsonObject(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}
