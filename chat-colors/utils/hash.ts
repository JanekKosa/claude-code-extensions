/**
 * Generic helper: a short key for a text, the same for the same text in every run and every process.
 */

/**
 * Hashes a text to a short key: cyrb53, a 53-bit hash, written in base 36. Two different texts share a key about
 * once in 9 * 10^15 pairs.
 *
 * @param text any text
 * @returns up to 11 lowercase letters and digits, such as `"2c3vd1u9mrx"`
 */
export function hashText(text: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57

  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i)

    h1 = Math.imul(h1 ^ unit, 2654435761)
    h2 = Math.imul(h2 ^ unit, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}
