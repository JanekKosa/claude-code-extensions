/**
 * Generic helper: a list written as comma-separated text, as a configuration field holds it.
 */

/**
 * Splits comma-separated text into its entries, each trimmed, empty ones dropped.
 *
 * @param text the list as written, such as `"vscode, desktop"`
 * @returns the entries in order, such as `["vscode", "desktop"]`
 */
export function splitList(text: string): string[] {
  return text
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => entry !== '')
}
