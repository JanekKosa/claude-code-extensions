/**
 * Tests the helpers of the compiled-extension and package checks in temp folders: which folder is checked and of
 * which kind (a project, the extension\ folder of an unpacked .vsix, a folder VS Code installed), the files each kind
 * must hold, and whether a folder holds the current build: a project's dist\ by time against src\, the two other
 * kinds by content against the project's build, with each kind of difference named.
 */

import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { expectedPackageFiles, folderKind, folderToCheck, notBuiltReason } from './compiled-folder';
import { projectRoot } from './paths';

/** A time for the older files, as seconds since 1970. */
const older = 1_700_000_000;

/** A time for the newer files: a minute later. */
const newer = older + 60;

/** The compiled entry point of the temp project's build. */
const compiledEntry = '"use strict";\nexports.activate = activate;\n';

/** The compiled button of the temp project's build. */
const compiledButton = '"use strict";\nexports.chatView = {};\n';

/** The temp project's README. */
const readme = '# Claude Toolbar\n';

/** The temp project's package.json: a name and one menu entry with a when-clause. */
const manifest = { name: 'claude-toolbar', contributes: { menus: { 'view/title': [{ command: 'claudeToolbar.x', when: 'view == a' }] } } };

/** What VS Code adds to the package.json of an extension it installed. */
const installMetadata = { __metadata: { installedTimestamp: 1_761_238_915_000, targetPlatform: 'undefined', size: 1234 } };

describe('the compiled-folder helpers', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'claude-toolbar-compiled-folder-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  /**
   * Writes a file under the temp folder, creating its folder, with a last-write time.
   * @param path its path under the temp folder
   * @param content its content
   * @param seconds its last-write time, as seconds since 1970
   */
  function write(path: string, content = '', seconds = older): void {
    const full = join(root, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
    utimesSync(full, seconds, seconds);
  }

  /**
   * Builds a project in the temp folder: two sources, a minute newer than their compiled files, package.json and
   * README.md.
   * @returns its folder
   */
  function buildProject(): string {
    write('project/src/extension.ts', '', newer);
    write('project/src/buttons/chat-view.ts', '', newer);
    write('project/dist/extension.js', compiledEntry, newer);
    write('project/dist/buttons/chat-view.js', compiledButton, newer);
    write('project/package.json', JSON.stringify(manifest, undefined, 2));
    write('project/README.md', readme);
    return join(root, 'project');
  }

  /**
   * Writes a copy of the temp project's build as a package holds it: dist\ a minute older than the sources,
   * package.json written again with tabs, and the README as readme.md.
   * @param folder its path under the temp folder
   * @param added the keys its package.json holds besides the project's
   * @returns its folder
   */
  function copyBuild(folder: string, added: Record<string, unknown> = {}): string {
    write(`${folder}/dist/extension.js`, compiledEntry);
    write(`${folder}/dist/buttons/chat-view.js`, compiledButton);
    write(`${folder}/package.json`, JSON.stringify({ ...manifest, ...added }, undefined, '\t'));
    write(`${folder}/readme.md`, readme);
    return join(root, folder);
  }

  /**
   * Writes a copy of the temp project's build as VS Code installs it: with VS Code's .vsixmanifest, and __metadata in
   * package.json.
   * @returns its folder
   */
  function installBuild(): string {
    write('installed/.vsixmanifest', '<PackageManifest />');
    return copyBuild('installed', installMetadata);
  }

  it('checks this project unless CLAUDE_TOOLBAR_FOLDER names another folder', () => {
    expect(folderToCheck({})).toBe(projectRoot);
    expect(folderToCheck({ CLAUDE_TOOLBAR_FOLDER: 'C:\\unpacked\\extension' })).toBe('C:\\unpacked\\extension');
  });

  it("tells an installed folder by VS Code's .vsixmanifest inside it, an unpacked .vsix by the VSIX manifest beside it", () => {
    write('installed/.vsixmanifest');
    write('unpacked/extension.vsixmanifest');
    write('unpacked/extension/package.json');
    write('project/package.json');
    const kinds = ['installed', 'unpacked/extension', 'project'].map((folder) => folderKind(join(root, folder)));
    expect(kinds).toEqual(['installed', 'unpacked', 'project']);
  });

  it('expects one dist .js per src .ts, each other src file, the library files, package.json and the README, under the name each kind gives it', () => {
    write('src/extension.ts');
    write('src/buttons/chat-view.ts');
    write('src/media/page.ts');
    write('src/media/protocol.d.ts');
    write('src/media/page.css');
    const compiled = [
      'dist/buttons/chat-view.js',
      'dist/extension.js',
      'dist/media/iro.min.js',
      'dist/media/iro.min.js.LICENSE.txt',
      'dist/media/page.css',
      'dist/media/page.js',
    ];
    expect(expectedPackageFiles(join(root, 'src'), 'project')).toEqual(['README.md', ...compiled, 'package.json']);
    expect(expectedPackageFiles(join(root, 'src'), 'unpacked')).toEqual([...compiled, 'package.json', 'readme.md']);
    expect(expectedPackageFiles(join(root, 'src'), 'installed')).toEqual(['.vsixmanifest', ...compiled, 'package.json', 'readme.md']);
  });

  it('refuses a project without dist with "run npm run build"', () => {
    write('src/extension.ts');
    expect(notBuiltReason(root, 'project', root)).toBe(`${join(root, 'dist')} is missing: run npm run build`);
  });

  it('refuses a project dist older than a source, naming that source', () => {
    write('src/extension.ts', '', older);
    write('src/buttons/chat-view.ts', '', newer);
    write('dist/extension.js', '', older);
    write('dist/buttons/chat-view.js', '', older);
    expect(notBuiltReason(root, 'project', root)).toBe(
      `${join(root, 'dist')} is older than ${join(root, 'src', 'buttons/chat-view.ts')}: run npm run build`,
    );
  });

  it('accepts a project dist at least as new as every source', () => {
    write('src/extension.ts', '', older);
    write('dist/extension.js', '', older);
    write('dist/buttons/chat-view.js', '', newer);
    expect(notBuiltReason(root, 'project', root)).toBeUndefined();
  });

  it("accepts an installed folder holding the build, with VS Code's .vsixmanifest and __metadata, whatever its times", () => {
    const project = buildProject();
    const installed = installBuild();
    expect(notBuiltReason(installed, 'installed', project)).toBeUndefined();
    expect(notBuiltReason(installed, 'project', project)).toMatch(/ is older than .*: run npm run build$/);
  });

  it('names a dist file whose bytes differ from the build', () => {
    const project = buildProject();
    const installed = installBuild();
    write('installed/dist/extension.js', compiledEntry.replace('= activate;', '= activatE;'));
    expect(notBuiltReason(installed, 'installed', project)).toBe(
      `${join(installed, 'dist', 'extension.js')} differs from ${join(project, 'dist', 'extension.js')}`,
    );
  });

  it('names a dist file the build has and the folder misses', () => {
    const project = buildProject();
    const installed = installBuild();
    rmSync(join(installed, 'dist', 'buttons', 'chat-view.js'));
    expect(notBuiltReason(installed, 'installed', project)).toBe(
      `${join(installed, 'dist', 'buttons', 'chat-view.js')} is missing (the build has ${join(project, 'dist', 'buttons', 'chat-view.js')})`,
    );
  });

  it('names a dist file the build does not have', () => {
    const project = buildProject();
    const installed = installBuild();
    write('installed/dist/stale.js', '"use strict";\n');
    expect(notBuiltReason(installed, 'installed', project)).toBe(
      `${join(installed, 'dist', 'stale.js')} is not in the build (there is no ${join(project, 'dist', 'stale.js')})`,
    );
  });

  it("names a package.json that differs from the build's, with VS Code's __metadata left out", () => {
    const project = buildProject();
    const installed = installBuild();
    const changed = { ...manifest, contributes: { menus: { 'view/title': [{ command: 'claudeToolbar.x', when: 'view == b' }] } } };
    write('installed/package.json', JSON.stringify({ ...changed, ...installMetadata }, undefined, '\t'));
    expect(notBuiltReason(installed, 'installed', project)).toBe(
      `${join(installed, 'package.json')} differs from ${join(project, 'package.json')} (__metadata left out)`,
    );
  });

  it('accepts an unpacked .vsix holding the build, and counts __metadata in it as a difference', () => {
    const project = buildProject();
    expect(notBuiltReason(copyBuild('unpacked/extension'), 'unpacked', project)).toBeUndefined();
    const withMetadata = copyBuild('unpacked/extension', installMetadata);
    expect(notBuiltReason(withMetadata, 'unpacked', project)).toBe(`${join(withMetadata, 'package.json')} differs from ${join(project, 'package.json')}`);
  });

  it('names a readme.md that differs from the README.md of the build', () => {
    const project = buildProject();
    const installed = installBuild();
    write('installed/readme.md', `${readme}One more line.\n`);
    expect(notBuiltReason(installed, 'installed', project)).toBe(`${join(installed, 'readme.md')} differs from ${join(project, 'README.md')}`);
  });

  it('names only the first difference: dist\\ before package.json before readme.md', () => {
    const project = buildProject();
    const installed = installBuild();
    write('installed/readme.md', `${readme}One more line.\n`);
    write('installed/package.json', JSON.stringify({ name: 'other' }));
    write('installed/dist/extension.js', '');
    expect(notBuiltReason(installed, 'installed', project)).toBe(
      `${join(installed, 'dist', 'extension.js')} differs from ${join(project, 'dist', 'extension.js')}`,
    );
    write('installed/dist/extension.js', compiledEntry);
    expect(notBuiltReason(installed, 'installed', project)).toBe(
      `${join(installed, 'package.json')} differs from ${join(project, 'package.json')} (__metadata left out)`,
    );
  });
});
