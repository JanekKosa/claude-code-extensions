/**
 * Where the bridge file lives: `<home>\.claude\claude-code-extensions\chat-view.json`.
 */

import { join } from 'node:path';

/**
 * The bridge file's place under the user's home folder.
 *
 * chat-colors\hooks\bridge-path.ts and hide-actions\hooks\bridge-path.ts (the readers) name the same file: change them
 * together.
 */
const bridgePathParts = ['.claude', 'claude-code-extensions', 'chat-view.json'] as const;

/**
 * Builds the bridge file's full path.
 * @param homeFolder the user's home folder
 * @returns the path
 */
export function bridgeFilePath(homeFolder: string): string {
  return join(homeFolder, ...bridgePathParts);
}
