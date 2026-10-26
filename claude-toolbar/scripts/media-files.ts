/**
 * What the build copies into dist\ besides what the compiler writes: every file of src\ that is not TypeScript (to
 * the same place under dist\), and the library files from node_modules into the media folder. Shared by
 * copy-media.ts and the package check, so both know the same files.
 */

import { iroLicenseFile, iroScriptFile } from '../src/panes/media';

/** A file of an npm package that the build copies into the media folder, unmodified. */
export interface LibraryFile {
  /** Its path under node_modules, folder by folder. */
  readonly from: readonly string[];
  /** Its name in the media folder. */
  readonly to: string;
}

/** The library files: iro.js, the color wheel, and its license text (MPL-2.0), from its package @jaames/iro. */
export const libraryFiles: readonly LibraryFile[] = [
  { from: ['@jaames', 'iro', 'dist', 'iro.min.js'], to: iroScriptFile },
  { from: ['@jaames', 'iro', 'LICENSE.txt'], to: iroLicenseFile },
];

/**
 * Says whether a file of src\ is copied as it is: every file that is not TypeScript. A .ts file is compiled; a .d.ts
 * file only holds types the two programs share.
 * @param path the file's path under src\
 * @returns true when the build copies it
 */
export function isCopiedSource(path: string): boolean {
  return !path.endsWith('.ts');
}
