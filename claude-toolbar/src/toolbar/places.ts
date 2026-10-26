/**
 * The places the toolbar shows in: the title bar of Claude's side bar chat views, and the title bar of a Claude
 * chat opened as an editor tab. Built from the ids in host\claude-extension.ts.
 */

import { claudeExtension } from '../host/claude-extension';
import { equals, or, type WhenClause } from '../utils/when-clause';

/** A menu VS Code shows the toolbar in, and the condition that narrows it to Claude's chats. */
export interface Place {
  /** The menu's id in `contributes.menus`. */
  readonly menuId: string;
  /** When an item of this menu is on a Claude chat. */
  readonly when: WhenClause;
}

/** VS Code's context key naming the view whose title bar a `view/title` item is for. */
const viewKey = 'view';

/** VS Code's context key naming the webview panel of the active editor tab. */
const activePanelKey = 'activeWebviewPanelId';

/** The toolbar's places, in the order their menus appear in package.json. */
export const places: readonly Place[] = [
  {
    menuId: 'view/title',
    when: or(equals(viewKey, claudeExtension.views.sidebar), equals(viewKey, claudeExtension.views.secondarySidebar)),
  },
  {
    menuId: 'editor/title',
    when: equals(activePanelKey, claudeExtension.panelViewTypes.chat),
  },
];
