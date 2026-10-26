/**
 * Paths of the files the tests read or run: the extension's own package.json, the codicon table of
 * @vscode/codicons and vsce's command-line script.
 */

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The extension's folder (claude-toolbar\). */
export const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

/** The extension's package.json. */
export const packageJsonPath = join(projectRoot, 'package.json');

/** The codicon table: one row per icon, its name in the column `short_name`. */
export const codiconTablePath = join(projectRoot, 'node_modules', '@vscode', 'codicons', 'dist', 'codicon.csv');

/** vsce's command-line script, which the package check runs with node. */
export const vsceCliPath = join(projectRoot, 'node_modules', '@vscode', 'vsce', 'vsce');
