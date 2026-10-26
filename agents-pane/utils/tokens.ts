/**
 * Writing a token count the short way: `850`, `48k`, `1.2M`.
 */

const THOUSAND = 1_000
const MILLION = 1_000_000

/**
 * Writes a token count in thousands or millions once it reaches them: thousands rounded to whole ones, millions to
 * one decimal.
 *
 * @param tokens the count
 * @returns `850` below a thousand, `48k` below a million, `1.2M` from there
 */
export function formatTokens(tokens: number): string {
  const thousands = Math.round(tokens / THOUSAND)

  if (thousands >= THOUSAND) {
    return `${(tokens / MILLION).toFixed(1)}M`
  }

  if (tokens >= THOUSAND) {
    return `${thousands}k`
  }

  return String(tokens)
}
