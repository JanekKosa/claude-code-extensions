/**
 * Pins the toolbar's two places: the title bar of Claude's side bar chat views, and the title bar of a Claude chat
 * opened as an editor tab, as the text VS Code reads.
 */

import { describe, expect, it } from 'vitest';
import { places } from '../../src/toolbar/places';
import { renderWhen } from '../../src/utils/when-clause';

describe('the places', () => {
  it("are Claude's two side bar views and Claude's chat tab", () => {
    expect(places.map((place) => [place.menuId, renderWhen(place.when)])).toEqual([
      ['view/title', "view == 'claudeVSCodeSidebar' || view == 'claudeVSCodeSidebarSecondary'"],
      ['editor/title', "activeWebviewPanelId == 'claudeVSCodePanel'"],
    ]);
  });
});
