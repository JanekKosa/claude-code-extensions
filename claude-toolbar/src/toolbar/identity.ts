/**
 * The names of the toolbar's own things in VS Code: its namespace, its title, the id of each look's command, and the
 * ids of each pane's view and view container. The manifest builder, the command registration and the host all name
 * them through these functions, so they agree.
 */

import type { PaneDefinition } from '../host/pane';
import type { StateLook, ToolbarButton } from './contracts';

/** The prefix of every command id and every setting key the toolbar owns. */
export const toolbarNamespace = 'claudeToolbar';

/** The category shown with each command, and the heading of the toolbar's settings. */
export const toolbarTitle = 'Claude Toolbar';

/** The context key holding the Claude chat's context size in thousands of tokens, which picks the text shown. */
export const contextSizeKey = `${toolbarNamespace}.contextK`;

/**
 * Names the command of one look: `claudeToolbar.<buttonId>` for a button with one look,
 * `claudeToolbar.<buttonId>.<lookId>` otherwise.
 * @param button the button
 * @param look one of its looks
 * @returns the command id
 */
export function commandId(button: ToolbarButton, look: StateLook): string {
  return button.looks.length === 1 ? `${toolbarNamespace}.${button.id}` : `${toolbarNamespace}.${button.id}.${look.id}`;
}

/**
 * Names a pane's view: `claudeToolbar.<paneId>`.
 * @param pane the pane
 * @returns the view's id
 */
export function paneViewId(pane: Pick<PaneDefinition, 'id'>): string {
  return `${toolbarNamespace}.${pane.id}`;
}

/**
 * Names the view container that holds a pane's view in the panel: `claudeToolbar-<paneId>`. VS Code allows only
 * letters, digits, `_` and `-` in a container's id, so no dot.
 * @param pane the pane
 * @returns the container's id
 */
export function paneContainerId(pane: Pick<PaneDefinition, 'id'>): string {
  return `${toolbarNamespace}-${pane.id}`;
}
