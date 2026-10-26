/**
 * The reusable button action "show or hide this pane": while the pane's view is on the screen, a click hides the
 * bottom panel it sits in; otherwise it shows the view and focuses it. The manifest puts every pane in the bottom
 * panel, so hiding that panel is what closes the pane. Hiding disposes nothing: a terminal in the panel keeps running.
 */

import type { ButtonAction } from '../host/button-host';
import type { PaneDefinition } from '../host/pane';
import { focusViewCommand, vscodeWorkbench } from '../host/vscode-workbench';
import { paneViewId } from '../toolbar/identity';

/**
 * Returns the action that shows a pane when it is hidden and hides it when it shows.
 * @param pane the pane
 * @returns the action; it rejects when VS Code's command fails
 */
export function togglePane(pane: PaneDefinition): ButtonAction {
  return async (host) => {
    const viewId = paneViewId(pane);
    await host.runCommand(host.isPaneVisible(viewId) ? vscodeWorkbench.closePanelCommand : focusViewCommand(viewId));
  };
}
