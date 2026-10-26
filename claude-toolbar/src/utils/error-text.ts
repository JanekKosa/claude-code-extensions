/**
 * The message of anything thrown, for the error texts the toolbar shows. Generic: knows nothing of the toolbar.
 */

/**
 * Returns the message of something thrown or rejected with: an Error's message, anything else as text.
 * @param thrown what was thrown
 * @returns its message
 */
export function errorText(thrown: unknown): string {
  return thrown instanceof Error ? thrown.message : String(thrown);
}
