/**
 * The contexts the toolbar's menus are checked in: Claude's side bar view, its secondary side bar view and its chat
 * tab, and two that are not Claude's (the Explorer, a Markdown preview tab); and the two values of Claude's Focus
 * view setting, the one setting the menus read. tests\toolbar\menu-visibility.test.ts decides what each menu shows
 * in them; any other check of the menus takes the same contexts from here.
 */

import { claudeExtension } from '../../src/host/claude-extension';

/** The contexts a menu can be in, and whether each is a Claude chat. */
export const contexts = [
  { menuId: 'view/title', name: "Claude's side bar view", claude: true, keys: { view: claudeExtension.views.sidebar } },
  { menuId: 'view/title', name: "Claude's secondary side bar view", claude: true, keys: { view: claudeExtension.views.secondarySidebar } },
  { menuId: 'view/title', name: 'the Explorer view', claude: false, keys: { view: 'workbench.explorer.fileView' } },
  { menuId: 'editor/title', name: "Claude's chat tab", claude: true, keys: { activeWebviewPanelId: claudeExtension.panelViewTypes.chat } },
  { menuId: 'editor/title', name: 'a Markdown preview tab', claude: false, keys: { activeWebviewPanelId: 'markdown.preview' } },
];

/** The two values of Claude's Focus view setting. */
export const combinations = [false, true].map((focusView) => ({ focusView }));
