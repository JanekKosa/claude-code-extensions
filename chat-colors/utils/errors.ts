/**
 * Generic helper: telling which OS error a rejection reports.
 */

/**
 * Tells whether a rejection names the OS error `errno` (such as `ENOENT`) in its message, as a word of its own.
 *
 * @param err what the promise rejected with
 * @param errno the error's name, such as `"ENOENT"`
 * @returns true when the message holds that name
 */
export function namesErrno(err: unknown, errno: string): boolean {
  const message = err instanceof Error ? err.message : String(err)

  return message.split(/[^A-Z0-9_]+/).includes(errno)
}
