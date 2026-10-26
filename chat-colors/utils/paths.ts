/**
 * Generic helper: building a path under a folder in that folder's own separator style.
 */

/**
 * Joins names under a base folder with the separator the base already uses: `\` when it holds one, else `/`.
 *
 * @param base the folder, such as `C:\Users\jan` or `/home/jan`; a trailing separator is dropped
 * @param parts the names below it, in order
 * @returns the joined path, such as `C:\Users\jan\.claude\x.json`
 */
export function joinUnder(base: string, parts: readonly string[]): string {
  const separator = base.includes('\\') ? '\\' : '/'

  return [base.replace(/[\\/]+$/, ''), ...parts].join(separator)
}
