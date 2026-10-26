/**
 * The package check: what vsce packs is exactly one dist\ .js per src\ .ts, every other src\ file, the library files
 * of the media folder, package.json and README.md, with 0 extra and 0 missing; every file the Chat colors page loads
 * is among them; and iro.js and its license are unmodified, byte for byte as their npm package has them. For this
 * project it asks vsce itself (`vsce ls`, with the flag of `npm run package` that changes what is packed). For the
 * extension\ folder of an unpacked .vsix, or a folder VS Code installed the package into (CLAUDE_TOOLBAR_FOLDER naming
 * either), it lists the folder: there vsce has renamed the README to readme.md, and an installed folder also holds VS
 * Code's own .vsixmanifest. The expected list is built from src\, so it follows the buttons as they are added.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { libraryFiles } from '../scripts/media-files';
import { chatColorsHtml } from '../src/panes/chat-colors/chat-colors-html';
import { mediaFolder } from '../src/panes/media';
import { expectedPackageFiles, filesUnder, folderKind, folderToCheck } from './helpers/compiled-folder';
import { projectRoot, vsceCliPath } from './helpers/paths';

/** The flags of `npm run package` that change which files vsce packs; `vsce ls` takes them too. */
const packingFlags = ['--no-dependencies'];

/**
 * Asks vsce which files it packs from a folder.
 * @param folder the extension's folder
 * @returns the files, as vsce lists them, sorted
 */
function vscePackedFiles(folder: string): string[] {
  const output = execFileSync(process.execPath, [vsceCliPath, 'ls', ...packingFlags], { cwd: folder, encoding: 'utf8' });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .sort();
}

/**
 * Lists the media files the Chat colors page loads, as its HTML names them.
 * @returns their paths in the package
 */
function chatColorsPageFiles(): string[] {
  const html = chatColorsHtml({ mediaUrl: (fileName) => `media:${fileName}`, cspSource: 'source', nonce: 'nonce' });
  return [...html.matchAll(/"media:([^"]+)"/g)].map((match) => [...mediaFolder, match[1]].join('/'));
}

const folder = folderToCheck();
const kind = folderKind(folder);
const packed = kind === 'project' ? vscePackedFiles(folder) : filesUnder(folder);
const expected = expectedPackageFiles(join(projectRoot, 'src'), kind);
const pageFiles = chatColorsPageFiles();

describe(`the package of ${folder} (${kind})`, () => {
  it(`holds no file beyond the ${expected.length} expected`, () => {
    expect(packed.filter((path) => !expected.includes(path)), 'extra files (npm run package removes a stale dist\\ first)').toEqual([]);
  });

  it(`holds every one of the ${expected.length} expected files`, () => {
    expect(expected.filter((path) => !packed.includes(path)), 'missing files').toEqual([]);
  });

  it(`holds every file the Chat colors page loads: ${pageFiles.join(', ')}`, () => {
    expect(pageFiles.filter((path) => !packed.includes(path))).toEqual([]);
  });

  it('holds iro.js and its license unmodified, byte for byte as their npm package has them', () => {
    const changed = libraryFiles.filter(
      (library) => !readFileSync(join(folder, ...mediaFolder, library.to)).equals(readFileSync(join(projectRoot, 'node_modules', ...library.from))),
    );
    expect(changed.map((library) => library.to)).toEqual([]);
  });
});
