/**
 * Small text helpers: the first line of a text, a text cut to a length, the last part of a path.
 */

const ELLIPSIS = '…'

/**
 * Takes the first non-empty line of a text, trimmed.
 *
 * @param text the text
 * @returns that line; empty when the text has none
 */
export function firstLine(text: string): string {
  return (
    text
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(line => line.length > 0) ?? ''
  )
}

/**
 * Cuts a text to at most `max` characters, ending a cut one with an ellipsis.
 *
 * @param text the text
 * @param max the most characters kept, the ellipsis included; at least 1
 * @returns the text whole when it fits, else its head and `…`
 */
export function shorten(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1))}${ELLIPSIS}`
}

/**
 * Takes the last part of a path, by either kind of slash.
 *
 * @param path a file path, Windows or POSIX
 * @returns its file or folder name; the path itself when it has no slash
 */
export function baseName(path: string): string {
  const parts = path.split(/[\\/]/).filter(part => part.length > 0)

  return parts[parts.length - 1] ?? path
}
