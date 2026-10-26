/**
 * Where the bridge file lives: `<home>\.claude\claude-code-extensions\chat-view.json`, home being USERPROFILE,
 * else HOME.
 */
import type { EngineInterface } from 'claude-code'

import { joinUnder } from '../utils/paths'

// ── The place (a protocol constant) ──

/**
 * The bridge file's place under the user's home folder.
 *
 * claude-toolbar\src\bridge\bridge-path.ts (the writer) names the same file: change both together.
 */
export const BRIDGE_PATH_PARTS = ['.claude', 'claude-code-extensions', 'chat-view.json'] as const

// ── Finding it ──

/**
 * Finds the user's home folder.
 *
 * @param $ the engine interface (its environment)
 * @returns USERPROFILE, else HOME; undefined when neither is set
 */
async function homeFolder($: Pick<EngineInterface, 'env'>): Promise<string | undefined> {
  return (await $.env.get('USERPROFILE')) || (await $.env.get('HOME')) || undefined
}

/**
 * Builds the bridge file's full path.
 *
 * @param $ the engine interface (its environment)
 * @returns the path, or undefined when no home folder is set
 */
export async function bridgePath($: Pick<EngineInterface, 'env'>): Promise<string | undefined> {
  const home = await homeFolder($)

  return home === undefined ? undefined : joinUnder(home, BRIDGE_PATH_PARTS)
}
