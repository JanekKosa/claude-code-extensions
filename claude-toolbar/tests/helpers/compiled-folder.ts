/**
 * The folder the compiled-extension check and the package check look at, and what they expect of it. The folder is
 * the one the environment variable CLAUDE_TOOLBAR_FOLDER names, else this project. Three kinds of folder are told
 * apart: a project (this one or a copy), the extension\ folder of an unpacked .vsix, and a folder VS Code installed
 * the package into (%USERPROFILE%\.vscode\extensions\janekkosa.claude-toolbar-<version>, say). What a folder is
 * compared with always comes from this project: its src\, and for the two other kinds its build.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { isCopiedSource, libraryFiles } from '../../scripts/media-files';
import { mediaFolder } from '../../src/panes/media';
import { projectRoot } from './paths';

// ---------------------------------------------------------------------------------------------------------------
// The names the checks rely on
// ---------------------------------------------------------------------------------------------------------------

/** The environment variable that names another folder to check. */
const folderVariable = 'CLAUDE_TOOLBAR_FOLDER';

/** The file at the root of an unpacked .vsix, beside its extension\ folder (the VSIX format). */
const vsixManifestName = 'extension.vsixmanifest';

/** The file VS Code keeps inside a folder it installed an extension into: its own copy of the VSIX manifest. */
const installedManifestName = '.vsixmanifest';

/** The key VS Code adds to the package.json of an extension it installed (installedTimestamp, targetPlatform, size). */
const installMetadataKey = '__metadata';

/** This project's README; `vsce ls` lists it under this name too. */
const projectReadmeName = 'README.md';

/** The README's name inside a .vsix and in an installed folder: vsce's ReadmeProcessor renames it. */
const packedReadmeName = 'readme.md';

/** The kinds of folder the checks tell apart. */
export type FolderKind = 'project' | 'unpacked' | 'installed';

/** What each kind of folder holds besides the compiled files and package.json. */
const filesBesideTheBuild: Readonly<Record<FolderKind, readonly string[]>> = {
  project: [projectReadmeName],
  unpacked: [packedReadmeName],
  installed: [packedReadmeName, installedManifestName],
};

// ---------------------------------------------------------------------------------------------------------------
// Which folder, of which kind
// ---------------------------------------------------------------------------------------------------------------

/**
 * Names the folder to check.
 * @param environment the environment variables
 * @returns the folder CLAUDE_TOOLBAR_FOLDER names, else this project
 */
export function folderToCheck(environment: NodeJS.ProcessEnv = process.env): string {
  return environment[folderVariable] ?? projectRoot;
}

/**
 * Tells which kind of folder a folder is.
 * @param folder the folder
 * @returns 'installed' when VS Code's .vsixmanifest is inside it, 'unpacked' when the VSIX manifest sits beside it
 *   (the extension\ folder of an unpacked .vsix), else 'project'
 */
export function folderKind(folder: string): FolderKind {
  if (existsSync(join(folder, installedManifestName))) return 'installed';
  if (existsSync(join(folder, '..', vsixManifestName))) return 'unpacked';
  return 'project';
}

// ---------------------------------------------------------------------------------------------------------------
// What a package holds
// ---------------------------------------------------------------------------------------------------------------

/**
 * Lists the files under a folder, at any depth.
 * @param folder the folder
 * @returns their paths relative to it, with forward slashes, sorted; none when the folder is missing
 */
export function filesUnder(folder: string): string[] {
  if (!existsSync(folder)) return [];
  return readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(folder, join(entry.parentPath, entry.name)).split(sep).join('/'))
    .sort();
}

/**
 * Lists the files a folder of a kind must hold: one dist\ .js per .ts of the sources (a .d.ts compiles to nothing),
 * every other file of the sources copied to the same place under dist\, the library files in the media folder
 * (scripts\media-files.ts), package.json and the README, which vsce adds to every package besides the files
 * .vscodeignore lets in, and in an installed folder VS Code's own .vsixmanifest.
 * @param sourceFolder the src\ folder
 * @param kind the kind of folder whose listing is compared
 * @returns their paths in that folder, with forward slashes, sorted
 */
export function expectedPackageFiles(sourceFolder: string, kind: FolderKind): string[] {
  const sources = filesUnder(sourceFolder);
  const compiled = sources.filter((path) => path.endsWith('.ts') && !path.endsWith('.d.ts')).map((path) => `dist/${path.slice(0, -'.ts'.length)}.js`);
  const copied = sources.filter(isCopiedSource).map((path) => `dist/${path}`);
  const libraries = libraryFiles.map((library) => [...mediaFolder, library.to].join('/'));
  return [...compiled, ...copied, ...libraries, 'package.json', ...filesBesideTheBuild[kind]].sort();
}

/**
 * Says whether a file of dist\ is in the media folder, whose files a pane's page loads in a webview, not Node.
 * @param path the file's path under dist\, with forward slashes
 * @returns true when it is in the media folder
 */
export function isMediaFile(path: string): boolean {
  return path.startsWith(`${mediaFolder.slice(1).join('/')}/`);
}

// ---------------------------------------------------------------------------------------------------------------
// Whether a folder holds the current build
// ---------------------------------------------------------------------------------------------------------------

/**
 * Says why a folder does not hold this project's current build. A project's dist\ is compared with the sources by
 * time. An unpacked .vsix or an installed folder is compared with this project's build by content, because the times
 * of a zip or an install prove nothing: every dist\ file byte for byte, package.json as JSON, readme.md byte for
 * byte with README.md.
 * @param folder the folder
 * @param kind its kind
 * @param project this project's folder, holding src\ and the build
 * @returns the reason, naming the first file that differs; undefined when the folder holds the current build
 */
export function notBuiltReason(folder: string, kind: FolderKind, project: string): string | undefined {
  return kind === 'project' ? staleDistReason(folder, join(project, 'src')) : firstDifferenceFromBuild(folder, kind, project);
}

/**
 * Says why a project's dist\ cannot be checked: it is missing, or a source is newer than its oldest compiled file.
 * @param folder the folder holding dist\
 * @param sourceFolder the src\ folder it was built from
 * @returns the reason, ending in "run npm run build"; undefined when dist\ is at least as new as every source
 */
function staleDistReason(folder: string, sourceFolder: string): string | undefined {
  const dist = join(folder, 'dist');
  const compiled = filesUnder(dist).filter((path) => path.endsWith('.js'));
  if (compiled.length === 0) return `${dist} is missing: run npm run build`;
  const oldestCompiled = Math.min(...compiled.map((path) => statSync(join(dist, path)).mtimeMs));
  const newer = filesUnder(sourceFolder).filter((path) => statSync(join(sourceFolder, path)).mtimeMs > oldestCompiled);
  return newer.length === 0 ? undefined : `${dist} is older than ${join(sourceFolder, newer[0])}: run npm run build`;
}

/**
 * Names the first file of an unpacked .vsix or an installed folder that differs from this project's build: the
 * dist\ files in order, then package.json, then readme.md.
 * @param folder the folder
 * @param kind its kind ('unpacked' or 'installed')
 * @param project this project's folder
 * @returns the difference; undefined when there is none
 */
function firstDifferenceFromBuild(folder: string, kind: FolderKind, project: string): string | undefined {
  return (
    firstDistDifference(join(folder, 'dist'), join(project, 'dist')) ??
    manifestDifference(join(folder, 'package.json'), join(project, 'package.json'), kind) ??
    fileDifference(join(folder, packedReadmeName), join(project, projectReadmeName))
  );
}

/**
 * Names the first file in which two dist\ folders differ: present in one only, or other bytes.
 * @param dist the dist\ folder checked
 * @param buildDist this project's dist\
 * @returns the difference; undefined when both hold the same files with the same bytes
 */
function firstDistDifference(dist: string, buildDist: string): string | undefined {
  const paths = [...new Set([...filesUnder(dist), ...filesUnder(buildDist)])].sort();
  return paths.map((path) => fileDifference(join(dist, path), join(buildDist, path))).find((difference) => difference !== undefined);
}

/**
 * Says how a file differs from the build's: it is missing, the build has no such file, or its bytes differ.
 * @param copy the file checked
 * @param original the build's file
 * @returns the difference; undefined when both exist with the same bytes
 */
function fileDifference(copy: string, original: string): string | undefined {
  if (!existsSync(copy)) return `${copy} is missing (the build has ${original})`;
  if (!existsSync(original)) return `${copy} is not in the build (there is no ${original})`;
  return readFileSync(copy).equals(readFileSync(original)) ? undefined : `${copy} differs from ${original}`;
}

/**
 * Says whether a package.json differs from the build's, compared as JSON. In an installed folder the key VS Code
 * adds is left out of the comparison; in an unpacked .vsix it would be a difference.
 * @param manifest the package.json checked
 * @param buildManifest this project's package.json
 * @param kind the kind of folder the package.json checked is in
 * @returns the difference; undefined when they are equal
 */
function manifestDifference(manifest: string, buildManifest: string, kind: FolderKind): string | undefined {
  const compared = JSON.parse(readFileSync(manifest, 'utf8')) as Record<string, unknown>;
  if (kind === 'installed') delete compared[installMetadataKey];
  if (isDeepStrictEqual(compared, JSON.parse(readFileSync(buildManifest, 'utf8')))) return undefined;
  return `${manifest} differs from ${buildManifest}${kind === 'installed' ? ` (${installMetadataKey} left out)` : ''}`;
}
