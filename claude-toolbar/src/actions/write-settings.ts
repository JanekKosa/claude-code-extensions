/**
 * The reusable button action "write these settings": explicit values at the user (Global) level, as Claude's own
 * Ctrl+Alt+F writes its Focus view.
 */

import type { ButtonAction, SettingValues } from '../host/button-host';

/**
 * Returns the action that writes the given settings at the user (Global) level.
 * @param values the settings to write, by full key
 * @returns the action
 */
export function writeSettings(values: SettingValues): ButtonAction {
  return (host) => host.writeSettings(values, 'global');
}
