/**
 * Checks, read-only, that the newest installed copy of Claude's VS Code extension still has every id in
 * src\host\claude-extension.ts: each view in its `contributes.views`, each panel view type in its main script, each
 * boolean setting in its `contributes.configuration` with type boolean, and each theme color read first by the chat
 * variable its stylesheet draws that part in. The extensions folder is `%USERPROFILE%\.vscode\extensions`, or VS Code's
 * own override VSCODE_EXTENSIONS when set.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { claudeExtension } from '../../src/host/claude-extension';
import { themeColorVariable } from '../../src/host/vscode-workbench';
import { newestExtensionFolder } from '../helpers/extension-folders';

/** Claude's extension in the marketplace: `<publisher>.<name>`. */
const claudeExtensionId = 'anthropic.claude-code';

/** The stylesheet of Claude's chat, under its extension folder. */
const chatStylesheet = ['webview', 'index.css'];

/** The folder VS Code installs user extensions in. */
const extensionsFolder = process.env.VSCODE_EXTENSIONS ?? join(homedir(), '.vscode', 'extensions');

/** The part of Claude's package.json the checks read. */
interface ClaudeManifest {
  readonly main: string;
  readonly contributes: {
    readonly views: Readonly<Record<string, readonly { readonly id: string }[]>>;
    readonly configuration: ConfigurationSection | readonly ConfigurationSection[];
  };
}

/** One section of `contributes.configuration`. */
interface ConfigurationSection {
  readonly properties?: Readonly<Record<string, { readonly type?: unknown }>>;
}

/**
 * Finds the folder of the newest installed copy of Claude's extension.
 * @returns the folder's full path
 */
function claudeFolder(): string {
  const folderName = newestExtensionFolder(readdirSync(extensionsFolder), claudeExtensionId);
  if (folderName === undefined) throw new Error(`No ${claudeExtensionId}-<version> folder in ${extensionsFolder}.`);
  return join(extensionsFolder, folderName);
}

/**
 * Lists the declared type of every setting in a configuration, which is one section or a list of them.
 * @param configuration Claude's `contributes.configuration`
 * @returns the type by setting key
 */
function settingTypes(configuration: ClaudeManifest['contributes']['configuration']): Map<string, unknown> {
  const sections: readonly ConfigurationSection[] = Array.isArray(configuration) ? configuration : [configuration as ConfigurationSection];
  return new Map(sections.flatMap((section) => Object.entries(section.properties ?? {}).map(([key, value]) => [key, value.type] as const)));
}

const folder = claudeFolder();
const manifest = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8')) as ClaudeManifest;
const mainScript = readFileSync(join(folder, manifest.main), 'utf8');
const viewIds = new Set(Object.values(manifest.contributes.views).flatMap((views) => views.map((view) => view.id)));
const types = settingTypes(manifest.contributes.configuration);
const stylesheet = readFileSync(join(folder, ...chatStylesheet), 'utf8');

describe(`Claude's extension (${folder})`, () => {
  it.each(Object.entries(claudeExtension.views))('has the view %s: %s', (_name, id) => {
    expect(viewIds.has(id)).toBe(true);
  });

  it.each(Object.entries(claudeExtension.panelViewTypes))('has the panel view type %s: %s', (_name, id) => {
    expect(new RegExp(`["'\`]${id}["'\`]`).test(mainScript)).toBe(true);
  });

  it.each(Object.entries(claudeExtension.booleanSettings))('has the boolean setting %s: %s', (_name, key) => {
    expect(types.get(key)).toBe('boolean');
  });

  it.each(Object.entries(claudeExtension.themeColors))("draws the %s in a variable that reads its theme color first: %o", (_name, { colorId, chatVariable }) => {
    expect(stylesheet.includes(`${chatVariable}:var(${themeColorVariable(colorId)}`)).toBe(true);
  });
});
