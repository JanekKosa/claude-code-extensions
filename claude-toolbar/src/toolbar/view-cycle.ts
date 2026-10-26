/**
 * Turns an ordered table of views into a button. From the one table come the current view (the first row whose
 * setting is on wins), the condition that shows each view's look, and the cycle a click follows, so the three
 * cannot disagree. A button file holds only the table.
 */

import { writeSettings } from '../actions/write-settings';
import type { ButtonAction, ButtonHost, SettingValues } from '../host/button-host';
import { and, not, setting, type WhenClause } from '../utils/when-clause';
import type { StateLook, ToolbarButton } from './contracts';

// ---------------------------------------------------------------------------------------------------------------
// The table
// ---------------------------------------------------------------------------------------------------------------

/** One row of a view table: a view, its look, the setting that selects it, and where a click on it goes. */
export interface ViewRow {
  /** The view's id, which is also its look's id (camelCase). */
  readonly id: string;
  /** The look's codicon name. */
  readonly icon: string;
  /** The look's tooltip: what the chat shows now, and what a click does. */
  readonly tooltip: string;
  /**
   * The boolean setting whose being on selects this view when no earlier row's setting is on. The last row has
   * none: it is the view when no other row's setting is on.
   */
  readonly selectedBy?: string;
  /** The settings that entering this view writes, as explicit values. */
  readonly writes: SettingValues;
  /** The id of the view that a click on this view's look enters. */
  readonly next: string;
}

/** What the derivation needs from the host: reading settings. */
export type SettingReader = Pick<ButtonHost, 'readSetting'>;

// ---------------------------------------------------------------------------------------------------------------
// The derivation
// ---------------------------------------------------------------------------------------------------------------

/**
 * Finds the current view: the first row whose setting is on, else the last row, which has none.
 * @param table the rows, in derivation order
 * @param reader reads the settings
 * @returns the current view's row
 */
export function deriveView(table: readonly ViewRow[], reader: SettingReader): ViewRow {
  const row = table.find((candidate) => candidate.selectedBy === undefined || Boolean(reader.readSetting(candidate.selectedBy)));
  if (row === undefined) throw new Error('No view matches the settings: the last row of a view table must select by no setting.');
  return row;
}

// ---------------------------------------------------------------------------------------------------------------
// The button
// ---------------------------------------------------------------------------------------------------------------

/**
 * Builds the button whose looks are the table's views. Each look shows exactly when the derivation picks its view;
 * a click on it writes the settings of the view its row names as next.
 * @param buttonId the button's id
 * @param table the rows, in derivation order
 * @returns the button
 */
export function viewCycleButton(buttonId: string, table: readonly ViewRow[]): ToolbarButton {
  return { id: buttonId, looks: table.map((row, index) => viewLook(table, row, index)) };
}

/**
 * Builds the look of one row.
 * @param table the whole table
 * @param row the row
 * @param index the row's position in the table
 * @returns the look
 */
function viewLook(table: readonly ViewRow[], row: ViewRow, index: number): StateLook {
  return { id: row.id, icon: row.icon, tooltip: row.tooltip, when: viewCondition(table, index), onClick: enterView(table, row.next) };
}

/**
 * Builds the condition under which the derivation picks the row at an index: no earlier row's setting is on, and
 * the row's own setting, if it has one, is.
 * @param table the whole table
 * @param index the row's position in the table
 * @returns the condition
 */
function viewCondition(table: readonly ViewRow[], index: number): WhenClause {
  const earlier = table.slice(0, index).flatMap((row) => (row.selectedBy === undefined ? [] : [not(setting(row.selectedBy))]));
  const own = table[index].selectedBy;
  return and(...earlier, ...(own === undefined ? [] : [setting(own)]));
}

/**
 * Builds the action that enters a view by writing its settings. The view is looked up when the click comes.
 * @param table the whole table
 * @param viewId the id of the view to enter
 * @returns the action
 */
function enterView(table: readonly ViewRow[], viewId: string): ButtonAction {
  return async (host) => writeSettings(findView(table, viewId).writes)(host);
}

/**
 * Finds a row by its view's id.
 * @param table the whole table
 * @param viewId the view's id
 * @returns the row
 */
function findView(table: readonly ViewRow[], viewId: string): ViewRow {
  const row = table.find((candidate) => candidate.id === viewId);
  if (row === undefined) throw new Error(`The view table has no view ${viewId}.`);
  return row;
}
