/**
 * `npm run manifest`: writes the toolbar's commands, menus and settings into package.json, built from the
 * button files. Writes nothing when package.json is already in step.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildContributes } from '../src/toolbar/manifest';
import { withContributes } from './package-json-text';
import { toolbarDefinition } from './toolbar-definition';

/** package.json of the extension, beside this script's folder. */
const packageJsonPath = join(__dirname, '..', 'package.json');

/**
 * Rewrites package.json when its `contributes` differ from what the buttons build, and says which happened.
 */
function writeManifest(): void {
  const before = readFileSync(packageJsonPath, 'utf8');
  const after = withContributes(before, buildContributes(toolbarDefinition));
  if (after === before) {
    console.log('package.json is already in step with the buttons.');
    return;
  }
  writeFileSync(packageJsonPath, after);
  console.log('package.json updated from the buttons.');
}

writeManifest();
