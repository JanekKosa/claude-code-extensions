/**
 * The user's `workbench.colorCustomizations`, read and changed one theme color at a time. Changing a color is a merge:
 * only that one key at the top level changes; every other key, and every block for one theme only (such as
 * `"[Monokai]": {...}`), stays exactly as it was. A color removed leaves the setting out entirely when nothing is left
 * in it. A change that changes nothing writes nothing.
 */

import { isJsonObject, type JsonObject, withKey } from '../utils/json-object';

/** What to do to the setting for one change: nothing, or write this value (undefined: remove the setting). */
export type CustomizationsWrite = { readonly changes: false } | { readonly changes: true; readonly value: JsonObject | undefined };

/**
 * Reads the color the user set for a theme color at the top level of the setting, for every theme.
 * @param current the setting's value in the user's settings, of any type (undefined while it is not set)
 * @param colorId the theme color's id, such as `descriptionForeground`
 * @returns the text the setting holds for it; null when it holds none (the theme's own color shows)
 */
export function customizedColor(current: unknown, colorId: string): string | null {
  if (!isJsonObject(current)) return null;
  const value = current[colorId];
  return typeof value === 'string' ? value : null;
}

/**
 * Works out the setting with one theme color set or removed.
 * @param current the setting's value in the user's settings (undefined while it is not set)
 * @param colorId the theme color's id
 * @param color the new color, or undefined to remove the user's color (back to the theme's)
 * @returns nothing to do when the color already is so; else the value to write, undefined when it is left empty
 * @throws when the setting holds something other than an object, which a color cannot be merged into
 */
export function withThemeColor(current: unknown, colorId: string, color: string | undefined): CustomizationsWrite {
  const customizations = current === undefined ? {} : current;
  if (!isJsonObject(customizations)) {
    throw new Error('workbench.colorCustomizations in your user settings is not an object, so it was left as it is.');
  }
  if (customizations[colorId] === color) return { changes: false };
  const changed = withKey(customizations, colorId, color);
  return { changes: true, value: Object.keys(changed).length === 0 ? undefined : changed };
}
