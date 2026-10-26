/**
 * The compiled-extension check. It loads the built extension as VS Code does: package.json's main, as CommonJS,
 * with require('vscode') answered by the fake 'vscode' (tests\fakes\vscode.ts). It runs activate once and checks what
 * that did: exactly the commands package.json declares, a webview view provider for exactly the views it declares,
 * and one subscription for each, plus one for the context size. It refuses a folder that does not hold the current build, and every file of dist\
 * outside the media folder must be CommonJS (the media folder's files run in a webview). Each of these fails as its
 * own test, with its reason.
 *
 * It checks this project, or the folder that CLAUDE_TOOLBAR_FOLDER names: the extension\ folder of an unpacked
 * .vsix, or a folder VS Code installed the package into. "The current build" is, for a project, a dist\ not older
 * than src\; for the two other kinds, this project's build itself: its dist\ byte for byte, its package.json (VS
 * Code's __metadata left out in an installed folder) and its README.md. The fake is the same module object these
 * tests read, so what the compiled code registers shows in it.
 */

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { compileFunction } from 'node:vm';
import { afterAll, describe, expect, it } from 'vitest';
import * as fakeVscodeApi from './fakes/vscode';
import { filesUnder, folderKind, folderToCheck, isMediaFile, notBuiltReason } from './helpers/compiled-folder';
import { type StandIn, standInForModule } from './helpers/module-stand-in';
import { projectRoot } from './helpers/paths';

/** The part of package.json the check reads. */
interface Manifest {
  readonly main: string;
  readonly activationEvents: readonly string[];
  readonly contributes: {
    readonly commands: readonly { readonly command: string }[];
    readonly views: Readonly<Record<string, readonly { readonly id: string }[]>>;
  };
}

/** The extension's context, as far as activate uses it. */
interface ExtensionContext {
  readonly subscriptions: { dispose(): unknown }[];
  readonly extensionUri: unknown;
}

/** The compiled extension's entry point. */
interface CompiledExtension {
  activate(context: ExtensionContext): void;
}

/** The names Node's CommonJS loader gives every module's code. */
const commonJsParameters = ['exports', 'require', 'module', '__filename', '__dirname'];

const folder = folderToCheck();
const kind = folderKind(folder);
const dist = join(folder, 'dist');
const builtRule =
  kind === 'project'
    ? 'dist\\ is there and not older than src\\'
    : "dist\\, package.json and readme.md are this project's build (package.json compared as JSON)";
const manifest = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8')) as Manifest;
const declaredIds = manifest.contributes.commands.map((command) => command.command);
const declaredViews = Object.values(manifest.contributes.views).flatMap((views) => views.map((view) => view.id));

/**
 * Says why a compiled file is not CommonJS, which VS Code needs here (package.json has no "type": "module").
 * @param path the compiled file
 * @returns `<path>: <the parse error>`, or nothing when the file parses as CommonJS
 */
function notCommonJs(path: string): string[] {
  try {
    compileFunction(readFileSync(path, 'utf8'), commonJsParameters, { filename: path });
    return [];
  } catch (error) {
    return [`${path}: ${(error as Error).message}`];
  }
}

describe(`the compiled extension in ${folder} (${kind})`, () => {
  const context: ExtensionContext = { subscriptions: [], extensionUri: fakeVscodeApi.Uri.file(folder) };
  let vscodeStandIn: StandIn | undefined;
  let activated = false;

  /**
   * Activates the built extension the first time a test needs it, as VS Code does at startup: refuses a folder that
   * does not hold the current build, answers require('vscode') with the fake, loads package.json's main and runs its
   * activate.
   */
  function activateOnce(): void {
    if (activated) return;
    const notBuilt = notBuiltReason(folder, kind, projectRoot);
    if (notBuilt !== undefined) throw new Error(notBuilt);
    vscodeStandIn = standInForModule('vscode', fakeVscodeApi);
    const entry = join(folder, manifest.main);
    (createRequire(entry)(entry) as CompiledExtension).activate(context);
    activated = true;
  }

  afterAll(() => {
    for (const subscription of context.subscriptions) subscription.dispose();
    vscodeStandIn?.remove();
  });

  it(`is built: ${builtRule}`, () => {
    expect(notBuiltReason(folder, kind, projectRoot)).toBeUndefined();
  });

  it('is CommonJS in every file of dist\\ outside the media folder', () => {
    expect(filesUnder(dist).filter((path) => !isMediaFile(path)).flatMap((path) => notCommonJs(join(dist, path)))).toEqual([]);
  });

  it('is started by VS Code shortly after startup (activationEvents onStartupFinished)', () => {
    expect(manifest.activationEvents).toEqual(['onStartupFinished']);
  });

  it(`registers exactly the ${declaredIds.length} commands package.json declares`, () => {
    activateOnce();
    expect([...fakeVscodeApi.fakeVscode.commands.keys()].sort()).toEqual([...declaredIds].sort());
  });

  it(`registers a webview view provider for exactly the views package.json declares: ${declaredViews.join(', ')}`, () => {
    activateOnce();
    expect([...fakeVscodeApi.fakeVscode.viewProviders.keys()]).toEqual(declaredViews);
  });

  it(`keeps ${declaredIds.length + declaredViews.length + 1} subscriptions: one per command, one per view, one for the context size`, () => {
    activateOnce();
    expect(context.subscriptions).toHaveLength(declaredIds.length + declaredViews.length + 1);
  });
});
