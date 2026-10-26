/**
 * Tests the registration: every look of every button becomes a command, under the ids package.json declares; a
 * click that fails shows exactly one error naming the look's tooltip, and the command itself does not reject; a
 * click that works shows none.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { toolbarButtons } from '../../src/buttons';
import type { ToolbarButton } from '../../src/toolbar/contracts';
import { registerButtons } from '../../src/toolbar/registration';
import { always } from '../../src/utils/when-clause';
import { FakeToolbarHost } from '../helpers/fake-toolbar-host';
import { packageJsonPath } from '../helpers/paths';

/** The command ids package.json declares. */
const declaredIds = (JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { contributes: { commands: { command: string }[] } }).contributes.commands.map(
  (command) => command.command,
);

/** VS Code's answer to an update of a setting no extension registers. */
const refusal = 'Unable to write to User Settings because claudeCode.focusView is not a registered configuration.';

/**
 * Runs a registered command, as VS Code would on a click.
 * @param host the fake host the commands were registered with
 * @param commandId the command's id
 * @returns what its handler returns
 */
function click(host: FakeToolbarHost, commandId: string): Promise<void> {
  const handler = host.registeredCommands.get(commandId);
  if (handler === undefined) throw new Error(`${commandId} is not registered`);
  return handler();
}

describe('registerButtons', () => {
  it("registers every look of the toolbar's buttons under the ids package.json declares", () => {
    const host = new FakeToolbarHost();
    const disposables = registerButtons(host, toolbarButtons);
    expect([...host.registeredCommands.keys()].sort()).toEqual([...declaredIds].sort());
    expect([host.registeredCommands.size, disposables.length]).toEqual([declaredIds.length, declaredIds.length]);
  });

  it('shows exactly one error when a click fails, and the command does not reject', async () => {
    const host = new FakeToolbarHost();
    vi.spyOn(host, 'writeSettings').mockRejectedValue(new Error(refusal));
    registerButtons(host, toolbarButtons);
    await expect(click(host, 'claudeToolbar.chatView.everything')).resolves.toBeUndefined();
    expect(host.errors).toEqual([`Clicking "Chat shows everything. Click for Focus view (Claude's work folded)." failed: ${refusal}`]);
  });

  it('catches a click that throws before it returns a promise', async () => {
    const host = new FakeToolbarHost();
    const throwing: ToolbarButton = {
      id: 'fixture',
      looks: [
        {
          id: 'only',
          icon: 'error',
          tooltip: 'Fixture. Click to fail.',
          when: always,
          onClick: () => {
            throw new Error('at once');
          },
        },
      ],
    };
    registerButtons(host, [throwing]);
    await expect(click(host, 'claudeToolbar.fixture')).resolves.toBeUndefined();
    expect(host.errors).toEqual(['Clicking "Fixture. Click to fail." failed: at once']);
  });

  it('shows no error when a click works', async () => {
    const host = new FakeToolbarHost();
    registerButtons(host, toolbarButtons);
    await click(host, 'claudeToolbar.chatView.everything');
    expect([host.errors, host.writes.length]).toEqual([[], 1]);
  });

  it('unregisters every command when its disposables are disposed', () => {
    const host = new FakeToolbarHost();
    for (const disposable of registerButtons(host, toolbarButtons)) disposable.dispose();
    expect(host.registeredCommands.size).toBe(0);
  });
});
