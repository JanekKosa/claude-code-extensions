/**
 * The context size: the Claude chat's context in thousands of tokens, as text left of every button, such as `212k`.
 * A command's title is fixed in package.json, so there is one look per value, each without an icon (VS Code then
 * draws its title as text) and shown while the context key holds its value. session\context-display.ts sets the key.
 * A click does nothing: it is a label.
 */

import type { StateLook, ToolbarButton } from '../toolbar/contracts';
import { contextSizeKey } from '../toolbar/identity';
import { contextKey, equals, not, or } from '../utils/when-clause';

/** Tokens in one unit of the shown size. */
const tokensPerK = 1000;

/**
 * The values the text can show, in thousands of tokens. Fixed when the manifest is built: one command per value.
 * `stepK` is the rounding step; `maxK` the largest value, shown as `<maxK>k+` for every size from it up.
 */
export const contextSizeScale = { stepK: 1, maxK: 1000 } as const;

// ---------------------------------------------------------------------------------------------------------------
// The value
// ---------------------------------------------------------------------------------------------------------------

/**
 * Turns a context size into the value the context key holds: rounded to the step, at most the largest value.
 * @param tokens the context size in tokens; undefined when no size is known yet
 * @returns the value in thousands, 0 when unknown
 */
export function contextSizeValue(tokens: number | undefined): number {
  const { stepK, maxK } = contextSizeScale;
  return Math.min(Math.round((tokens ?? 0) / tokensPerK / stepK) * stepK, maxK);
}

// ---------------------------------------------------------------------------------------------------------------
// The looks
// ---------------------------------------------------------------------------------------------------------------

/**
 * Builds one look per value from 0 to the largest, by the step: text `<n>k` (the largest `<n>k+`), shown while the
 * key holds that value; the 0 look also while the key is unset.
 * @param stepK the step, in thousands
 * @param maxK the largest value, in thousands
 * @returns the looks, smallest first
 */
export function contextSizeLooks(stepK: number, maxK: number): StateLook[] {
  const looks: StateLook[] = [];
  for (let value = 0; value <= maxK; value += stepK) {
    looks.push({
      id: `k${value}`,
      tooltip: value === maxK ? `${value}k+` : `${value}k`,
      when: value === 0 ? or(not(contextKey(contextSizeKey)), equals(contextSizeKey, '0')) : equals(contextSizeKey, String(value)),
      onClick: async () => undefined,
    });
  }
  return looks;
}

/** The context size. */
export const contextSizeButton: ToolbarButton = {
  id: 'contextSize',
  looks: contextSizeLooks(contextSizeScale.stepK, contextSizeScale.maxK),
};
