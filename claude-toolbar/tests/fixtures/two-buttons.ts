/**
 * A two-button toolbar for the manifest builder's tests: first a button with one look, then a button with two
 * looks that follow a fixture setting, shown in two fixture places (one of them an `||` of two views), and one pane.
 */

import type { PaneDefinition } from '../../src/host/pane';
import type { OwnedSetting, ToolbarButton } from '../../src/toolbar/contracts';
import type { ToolbarDefinition } from '../../src/toolbar/manifest';
import { viewCycleButton } from '../../src/toolbar/view-cycle';
import { always, equals, or } from '../../src/utils/when-clause';

/** The setting the second button follows. */
const secondSetting: OwnedSetting = {
  key: 'claudeToolbar.second',
  default: true,
  description: 'Turns the second button on.',
  scope: 'window',
};

/** A button with one look, always shown. */
const firstButton: ToolbarButton = {
  id: 'first',
  looks: [{ id: 'only', icon: 'add', tooltip: 'Add a thing.', when: always, onClick: async () => undefined }],
};

/** A button with two looks: on while its setting is on, off otherwise. */
const secondButton = viewCycleButton('second', [
  {
    id: 'on',
    icon: 'check',
    tooltip: 'Second is on. Click to turn it off.',
    selectedBy: secondSetting.key,
    writes: { [secondSetting.key]: false },
    next: 'off',
  },
  { id: 'off', icon: 'close', tooltip: 'Second is off. Click to turn it on.', writes: { [secondSetting.key]: true }, next: 'on' },
]);

/** A pane whose page no test builds. */
const fixturePane: PaneDefinition = { id: 'fixturePane', title: 'Fixture pane', icon: 'add', html: () => '', connect: () => ({ dispose: () => undefined }) };

/** The whole fixture toolbar. */
export const twoButtonToolbar: ToolbarDefinition = {
  buttons: [firstButton, secondButton],
  panes: [fixturePane],
  settings: [secondSetting],
  places: [
    { menuId: 'view/title', when: or(equals('view', 'fixtureView'), equals('view', 'otherFixtureView')) },
    { menuId: 'editor/title', when: equals('activeWebviewPanelId', 'fixturePanel') },
  ],
};
