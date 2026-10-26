/**
 * The last step of `npm run build`: copies into dist\ what the compiler does not write there (media-files.ts):
 * every file of src\ that is not TypeScript, to the same place, and the library files into the media folder. Each
 * file is written afresh rather than copied with its times, so it carries the build's time: the compiled-extension
 * check compares the times of dist\ with src\.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { mediaFolder } from '../src/panes/media';
import { isCopiedSource, libraryFiles } from './media-files';

/** The extension's folder, above this script's folder. */
const projectRoot = join(__dirname, '..');

/**
 * Copies every file of src\ that is not TypeScript to the same place under dist\.
 */
function copySources(): void {
  const sources = join(projectRoot, 'src');
  for (const entry of readdirSync(sources, { recursive: true, withFileTypes: true })) {
    const path = relative(sources, join(entry.parentPath, entry.name));
    if (entry.isFile() && isCopiedSource(path)) copyFile(join(sources, path), join(projectRoot, 'dist', path));
  }
}

/**
 * Copies the library files from node_modules into the media folder.
 */
function copyLibraries(): void {
  for (const library of libraryFiles) {
    copyFile(join(projectRoot, 'node_modules', ...library.from), join(projectRoot, ...mediaFolder, library.to));
  }
}

/**
 * Writes a file's bytes to a new place, creating its folder.
 * @param from the file
 * @param to where it goes
 */
function copyFile(from: string, to: string): void {
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, readFileSync(from));
}

copySources();
copyLibraries();
