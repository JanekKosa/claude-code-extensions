/**
 * The toolbar as the manifest is built from it: the buttons, the panes, the owned settings and the places. Shared by
 * write-manifest.ts and the tests that check package.json, so both build from the same definition.
 */

import { toolbarButtons } from '../src/buttons';
import { toolbarPanes } from '../src/panes';
import { ownedSettings } from '../src/settings/owned-settings';
import type { ToolbarDefinition } from '../src/toolbar/manifest';
import { places } from '../src/toolbar/places';

/** The whole toolbar. */
export const toolbarDefinition: ToolbarDefinition = { buttons: toolbarButtons, panes: toolbarPanes, settings: ownedSettings, places };
