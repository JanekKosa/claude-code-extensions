/**
 * Tests the layering rule: only src\extension.ts and src\host\vscode-host.ts use the module 'vscode' (an import,
 * an `import type`, an export from it, a require or a dynamic import), so all other code runs against fakes.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projectRoot } from './helpers/paths';

/** A use of the module 'vscode': `from 'vscode'`, `import 'vscode'`, `import('vscode')` or `require('vscode')`. */
const vscodeModuleUse = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]vscode['"]/;

/** The extension's sources. */
const sourceRoot = join(projectRoot, 'src');

describe('the layering', () => {
  it("lets only extension.ts and host\\vscode-host.ts use the module 'vscode'", () => {
    const users = readdirSync(sourceRoot, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
      .map((entry) => join(entry.parentPath, entry.name))
      .filter((path) => vscodeModuleUse.test(readFileSync(path, 'utf8')))
      .map((path) => relative(sourceRoot, path).split(sep).join('/'))
      .sort();
    expect(users).toEqual(['extension.ts', 'host/vscode-host.ts']);
  });
});
