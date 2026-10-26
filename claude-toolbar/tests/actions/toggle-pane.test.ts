/**
 * Tests the action "show or hide this pane": it shows and focuses a hidden pane with VS Code's `<viewId>.focus`, hides
 * the bottom panel with `workbench.action.closePanel` while the pane shows, and writes no setting.
 */

import { describe, expect, it } from 'vitest';
import { togglePane } from '../../src/actions/toggle-pane';
import type { PaneDefinition } from '../../src/host/pane';
import { FakeButtonHost } from '../helpers/fake-button-host';

/** A pane no test builds. */
const pane: PaneDefinition = { id: 'fixture', title: 'Fixture', icon: 'add', html: () => '', connect: () => ({ dispose: () => undefined }) };

describe('togglePane', () => {
  it('shows and focuses the pane while it is hidden, and writes no setting', async () => {
    const host = new FakeButtonHost();
    await togglePane(pane)(host);
    expect([host.commands, host.writes]).toStrictEqual([[{ commandId: 'claudeToolbar.fixture.focus', args: [] }], []]);
  });

  it('hides the bottom panel while the pane shows, and writes no setting', async () => {
    const host = new FakeButtonHost();
    host.visiblePanes.add('claudeToolbar.fixture');
    await togglePane(pane)(host);
    expect([host.commands, host.writes]).toStrictEqual([[{ commandId: 'workbench.action.closePanel', args: [] }], []]);
  });

  it('asks about its own pane only: another pane showing does not close the panel', async () => {
    const host = new FakeButtonHost();
    host.visiblePanes.add('claudeToolbar.other');
    await togglePane(pane)(host);
    expect(host.commands).toStrictEqual([{ commandId: 'claudeToolbar.fixture.focus', args: [] }]);
  });
});
