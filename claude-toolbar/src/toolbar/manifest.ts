/**
 * Builds the `contributes` VS Code reads for the toolbar, from the buttons, the panes, the owned settings and the
 * places: one command per look, one menu item per look in each place, every command hidden from the Command Palette,
 * one view container in the bottom panel per pane holding the pane's webview view, and the owned settings.
 * scripts\write-manifest.ts writes the result into package.json; nobody writes it by hand.
 */

import type { SettingValue } from '../host/button-host';
import type { PaneDefinition } from '../host/pane';
import { and, never, renderWhen, type WhenClause } from '../utils/when-clause';
import type { OwnedSetting, SettingScope, ToolbarButton } from './contracts';
import { commandId, paneContainerId, paneViewId, toolbarTitle } from './identity';
import type { Place } from './places';

// ---------------------------------------------------------------------------------------------------------------
// The contributes shape: only properties VS Code accepts from an extension
// ---------------------------------------------------------------------------------------------------------------

/** One entry of `contributes.commands`. */
export interface CommandContribution {
  readonly command: string;
  readonly title: string;
  readonly category: string;
  /** Left out for a look without an icon, which VS Code then draws as its title. */
  readonly icon?: string;
}

/** One entry of a menu in `contributes.menus`. */
export interface MenuItemContribution {
  readonly command: string;
  readonly when: string;
  readonly group?: string;
}

/** One setting under `contributes.configuration.properties`. */
export interface SettingContribution {
  readonly type: 'boolean' | 'number' | 'string';
  readonly default: SettingValue;
  readonly description: string;
  readonly scope: SettingScope;
}

/** `contributes.configuration`: the toolbar's settings under one heading. */
export interface ConfigurationContribution {
  readonly title: string;
  readonly properties: Readonly<Record<string, SettingContribution>>;
}

/** One view container of `contributes.viewsContainers`: a tab of its own in the panel. */
export interface ViewContainerContribution {
  readonly id: string;
  readonly title: string;
  readonly icon: string;
}

/** One view of `contributes.views`: a pane's webview view. */
export interface ViewContribution {
  readonly type: 'webview';
  readonly id: string;
  readonly name: string;
  readonly icon: string;
}

/** The keys of `contributes` the builder owns. */
export interface Contributes {
  readonly commands: readonly CommandContribution[];
  readonly menus: Readonly<Record<string, readonly MenuItemContribution[]>>;
  /** The panes' view containers, all in the bottom panel. */
  readonly viewsContainers: { readonly panel: readonly ViewContainerContribution[] };
  /** Each container's one view, by the container's id. */
  readonly views: Readonly<Record<string, readonly ViewContribution[]>>;
  readonly configuration: ConfigurationContribution;
}

/** Everything the manifest is built from. */
export interface ToolbarDefinition {
  /** The buttons, in toolbar order. */
  readonly buttons: readonly ToolbarButton[];
  /** The panes, in panel order. */
  readonly panes: readonly PaneDefinition[];
  /** The settings the toolbar owns. */
  readonly settings: readonly OwnedSetting[];
  /** The places the toolbar shows in. */
  readonly places: readonly Place[];
}

/** One look's item in one place's menu, its condition still an expression. */
export interface MenuEntry {
  readonly menuId: string;
  readonly command: string;
  readonly when: WhenClause;
  readonly group: string;
}

/** VS Code's menu group whose items show as icons at the top right of a title bar. */
const iconGroup = 'navigation';

/** The menu that decides which commands the Command Palette lists. */
const commandPaletteMenu = 'commandPalette';

// ---------------------------------------------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------------------------------------------

/**
 * Builds `contributes.commands`, `.menus`, `.viewsContainers`, `.views` and `.configuration` for the toolbar.
 * @param toolbar the buttons, the panes, the owned settings and the places
 * @returns the keys, ready to write into package.json
 */
export function buildContributes(toolbar: ToolbarDefinition): Contributes {
  const commands = buildCommands(toolbar.buttons);
  return {
    commands,
    menus: { ...buildPlaceMenus(buildMenuEntries(toolbar.buttons, toolbar.places)), [commandPaletteMenu]: hiddenFromPalette(commands) },
    viewsContainers: { panel: toolbar.panes.map(paneContainer) },
    views: Object.fromEntries(toolbar.panes.map((pane) => [paneContainerId(pane), [paneView(pane)]])),
    configuration: buildConfiguration(toolbar.settings),
  };
}

/**
 * Builds one menu entry per look in each place: shown when the place's condition and the look's both hold, in the
 * icon group, ordered by the button's position (`navigation@1` for the first button).
 * @param buttons the buttons, in toolbar order
 * @param places the places
 * @returns the entries, place by place, button by button, look by look
 */
export function buildMenuEntries(buttons: readonly ToolbarButton[], places: readonly Place[]): MenuEntry[] {
  return places.flatMap((place) =>
    buttons.flatMap((button, index) =>
      button.looks.map((look) => ({
        menuId: place.menuId,
        command: commandId(button, look),
        when: and(place.when, look.when),
        group: `${iconGroup}@${index + 1}`,
      })),
    ),
  );
}

/**
 * Builds one command per look: its tooltip as the title, under the toolbar's category, with the look's icon when it
 * has one.
 * @param buttons the buttons, in toolbar order
 * @returns the commands
 */
function buildCommands(buttons: readonly ToolbarButton[]): CommandContribution[] {
  return buttons.flatMap((button) =>
    button.looks.map((look) => ({
      command: commandId(button, look),
      title: look.tooltip,
      category: toolbarTitle,
      ...(look.icon === undefined ? {} : { icon: `$(${look.icon})` }),
    })),
  );
}

/**
 * Groups menu entries into the menus of package.json, rendering each condition to text.
 * @param entries the entries
 * @returns the menus by id
 */
function buildPlaceMenus(entries: readonly MenuEntry[]): Record<string, MenuItemContribution[]> {
  const menus: Record<string, MenuItemContribution[]> = {};
  for (const entry of entries) {
    (menus[entry.menuId] ??= []).push({ command: entry.command, when: renderWhen(entry.when), group: entry.group });
  }
  return menus;
}

/**
 * Builds the Command Palette entries that hide every toolbar command from it.
 * @param commands the toolbar's commands
 * @returns one entry per command, shown never
 */
function hiddenFromPalette(commands: readonly CommandContribution[]): MenuItemContribution[] {
  return commands.map((command) => ({ command: command.command, when: renderWhen(never) }));
}

/**
 * Builds a pane's view container: a tab in the bottom panel with the pane's title and icon.
 * @param pane the pane
 * @returns the container
 */
function paneContainer(pane: PaneDefinition): ViewContainerContribution {
  return { id: paneContainerId(pane), title: pane.title, icon: `$(${pane.icon})` };
}

/**
 * Builds a pane's view: a webview view with the pane's title and icon (VS Code's schema asks views for an icon).
 * @param pane the pane
 * @returns the view
 */
function paneView(pane: PaneDefinition): ViewContribution {
  return { type: 'webview', id: paneViewId(pane), name: pane.title, icon: `$(${pane.icon})` };
}

/**
 * Builds the owned settings under the toolbar's heading.
 * @param settings the owned settings
 * @returns the configuration
 */
function buildConfiguration(settings: readonly OwnedSetting[]): ConfigurationContribution {
  return {
    title: toolbarTitle,
    properties: Object.fromEntries(settings.map((owned) => [owned.key, settingContribution(owned)])),
  };
}

/**
 * Builds one setting's declaration.
 * @param owned the owned setting
 * @returns its declaration, typed by its default
 */
function settingContribution(owned: OwnedSetting): SettingContribution {
  return {
    type: typeof owned.default as SettingContribution['type'],
    default: owned.default,
    description: owned.description,
    scope: owned.scope,
  };
}
