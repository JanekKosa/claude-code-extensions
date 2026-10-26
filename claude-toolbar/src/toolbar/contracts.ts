/**
 * The toolbar's contracts: a button, the looks it can take, and a setting the toolbar owns. A button file in
 * buttons\ fills these in; the manifest builder and the command registration read them.
 */

import type { ButtonAction, SettingValue } from '../host/button-host';
import type { WhenClause } from '../utils/when-clause';

// ---------------------------------------------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------------------------------------------

/**
 * One look of a button: what it shows, when it shows, and what a click on it does. A button whose look follows a
 * state has one look per state, and exactly one of them shows at a time (VS Code gives extensions no `toggled`).
 */
export interface StateLook {
  /** Unique within its button, camelCase. Part of the look's command id. */
  readonly id: string;
  /**
   * A codicon name, such as `eye` (rendered `$(eye)`). A look without one shows its tooltip as text in the title
   * bar, as VS Code draws any title-bar item that has no icon.
   */
  readonly icon?: string;
  /** The hover text; it is also the command's title. */
  readonly tooltip: string;
  /** When this look shows, besides being in one of the toolbar's places. */
  readonly when: WhenClause;
  /** What a click on it does. */
  readonly onClick: ButtonAction;
}

/** A toolbar button: an id and its looks, in order. */
export interface ToolbarButton {
  /** Unique within the toolbar, camelCase. Part of every command id of the button. */
  readonly id: string;
  /** The looks, in order; a button with one look shows it wherever the toolbar shows. */
  readonly looks: readonly StateLook[];
}

// ---------------------------------------------------------------------------------------------------------------
// Owned settings
// ---------------------------------------------------------------------------------------------------------------

/** Where a setting may be set, as VS Code's `contributes.configuration` names it. */
export type SettingScope =
  | 'application'
  | 'machine'
  | 'machine-overridable'
  | 'window'
  | 'resource'
  | 'language-overridable';

/** A setting the toolbar declares in VS Code. Its type is the type of its default. */
export interface OwnedSetting<Value extends SettingValue = SettingValue> {
  /** The full key, such as `claudeToolbar.showLabels`. */
  readonly key: string;
  /** The value it has until the user sets it. */
  readonly default: Value;
  /** The plain-words description VS Code's Settings shows. */
  readonly description: string;
  /** Where it may be set. */
  readonly scope: SettingScope;
}
