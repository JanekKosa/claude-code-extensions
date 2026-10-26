/**
 * Registers the toolbar's buttons with VS Code: every look of every button becomes a command, named by commandId
 * (identity.ts) just as the manifest names it in package.json. The one place that catches a failing click: the
 * user sees one error naming what was clicked, and the command itself never fails.
 */

import type { Disposable, ToolbarHost } from '../host/toolbar-host';
import { errorText } from '../utils/error-text';
import type { StateLook, ToolbarButton } from './contracts';
import { commandId } from './identity';

/**
 * Registers a command for every look of every button.
 * @param host the toolbar's host
 * @param buttons the buttons, in toolbar order
 * @returns one disposable per look, which unregisters its command
 */
export function registerButtons(host: ToolbarHost, buttons: readonly ToolbarButton[]): Disposable[] {
  return buttons.flatMap((button) => button.looks.map((look) => host.registerCommand(commandId(button, look), () => click(host, look))));
}

/**
 * Runs a look's click; when it fails, shows `Clicking "<tooltip>" failed: <message>` once.
 * @param host the toolbar's host, which the click acts on
 * @param look the look clicked
 * @returns when the click has run or its error has been shown; never rejects
 */
async function click(host: ToolbarHost, look: StateLook): Promise<void> {
  try {
    await look.onClick(host);
  } catch (error) {
    host.showError(`Clicking "${look.tooltip}" failed: ${errorText(error)}`);
  }
}
