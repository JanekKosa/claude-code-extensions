/**
 * Tests the reusable action "run this command": it runs the command with its arguments, and rejects when the
 * command fails, so the registration shows the error.
 */

import { describe, expect, it, vi } from 'vitest';
import { runCommand } from '../../src/actions/run-command';
import { FakeButtonHost } from '../helpers/fake-button-host';

describe('runCommand', () => {
  it('runs the command with its arguments', async () => {
    const host = new FakeButtonHost();
    await runCommand('claude-vscode.toggleFocusView', 1, 'two')(host);
    expect(host.commands).toStrictEqual([{ commandId: 'claude-vscode.toggleFocusView', args: [1, 'two'] }]);
  });

  it('rejects when the command fails', async () => {
    const host = new FakeButtonHost();
    vi.spyOn(host, 'runCommand').mockRejectedValue(new Error("command 'x' not found"));
    await expect(runCommand('x')(host)).rejects.toThrow("command 'x' not found");
  });
});
