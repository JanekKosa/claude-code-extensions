/**
 * The reusable button action "run this command": runs a VS Code command, such as one of Claude's own, with fixed
 * arguments.
 */

import type { ButtonAction } from '../host/button-host';

/**
 * Returns the action that runs a command with the given arguments.
 * @param commandId the command's id
 * @param args the arguments passed to it
 * @returns the action; it rejects when the command fails
 */
export function runCommand(commandId: string, ...args: readonly unknown[]): ButtonAction {
  return async (host) => {
    await host.runCommand(commandId, ...args);
  };
}
