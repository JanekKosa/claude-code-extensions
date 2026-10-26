/**
 * Puts the built `contributes` keys into package.json's text, leaving every other field, the order of the
 * fields, the 2-space indent and the file's own line ending as they are.
 */

import type { Contributes } from '../src/toolbar/manifest';

/**
 * Returns package.json's text with `contributes.commands`, `.menus` and `.configuration` replaced. Other keys of
 * `contributes` stay; a key that is new goes at the end.
 * @param text package.json as read
 * @param contributes the three built keys
 * @returns the new text, ending with one line ending
 */
export function withContributes(text: string, contributes: Contributes): string {
  const manifest = JSON.parse(text) as Record<string, unknown>;
  manifest.contributes = { ...(manifest.contributes as Record<string, unknown> | undefined), ...contributes };
  const lineEnding = text.includes('\r\n') ? '\r\n' : '\n';
  return `${JSON.stringify(manifest, null, 2)}\n`.replace(/\n/g, lineEnding);
}
