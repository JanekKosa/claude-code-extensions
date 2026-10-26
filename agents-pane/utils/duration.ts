/**
 * Writing a length of time the short way a status line does: `9s`, `1m 02s`, `1h 04m`.
 */

const SECOND_MS = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

/**
 * Writes a length of time in the largest two units it reaches, the smaller one padded to two digits.
 *
 * @param ms the length, in milliseconds; a negative one counts as none
 * @returns `0s` to `59s`, then `1m 00s` to `59m 59s`, then `1h 00m` and up
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(Math.max(0, ms) / SECOND_MS)
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE)
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)

  if (hours > 0) {
    return `${hours}h ${pad(minutes % MINUTES_PER_HOUR)}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${pad(seconds % SECONDS_PER_MINUTE)}s`
  }

  return `${seconds}s`
}

/**
 * Pads a number below 100 to two digits.
 *
 * @param n the number
 * @returns `07` for 7, `42` for 42
 */
function pad(n: number): string {
  return String(n).padStart(2, '0')
}
