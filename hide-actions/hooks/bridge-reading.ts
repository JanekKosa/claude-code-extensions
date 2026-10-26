/**
 * Reading the bridge file once, and what its content means for `hideActions`.
 */
import type { EngineInterface } from 'claude-code'

import { namesErrno } from '../utils/errors'
import { isJsonObject, parseJson } from '../utils/json'

/**
 * What one read of the bridge says: hide the rows (true), show them (false), or keep the value held (`'keep'`).
 */
export type BridgeReading = boolean | 'keep'

/**
 * The OS error a read of a missing file rejects with. It reaches a hooks module only inside the rejection's
 * message (`hide-actions: $.fs.read: ENOENT: no such file or directory, ...`), not as Node's `code` field.
 */
const NOT_FOUND = 'ENOENT'

// ── Reading ──

/**
 * Reads the bridge file once, with one `$.fs.read`, which opens and closes the file at once; the file is never
 * held, so the toolbar's rename over it is never blocked.
 *
 * @param $ the engine interface (its file system)
 * @param path the bridge file's path
 * @returns false when the file is missing; `'keep'` when it cannot be read now (another refusal, such as EBUSY
 *   while the toolbar renames over it); else what its content says
 */
export async function readBridge($: Pick<EngineInterface, 'fs'>, path: string): Promise<BridgeReading> {
  return $.fs.read(path).then(hideActionsIn, (err: unknown) => (namesErrno(err, NOT_FOUND) ? false : 'keep'))
}

// ── Interpreting ──

/**
 * Says what the bridge file's text means for `hideActions`.
 *
 * @param text the file's text
 * @returns `'keep'` when it is not valid JSON (a write may be under way); true when it is an object whose
 *   `hideActions` is true; false for any other JSON
 */
function hideActionsIn(text: string): BridgeReading {
  const parsed = parseJson(text)

  if (!parsed.isJson) {
    return 'keep'
  }

  return isJsonObject(parsed.value) && parsed.value.hideActions === true
}
