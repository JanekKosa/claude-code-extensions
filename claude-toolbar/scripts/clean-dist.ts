/**
 * The first step of `npm run package`: removes dist\, so that the build which follows writes it afresh and no file
 * left over from an earlier build (the compiled file of a deleted button, say) can get into the package.
 */

import { rmSync } from 'node:fs';
import { join } from 'node:path';

/** The compiled extension, beside this script's folder. */
const distPath = join(__dirname, '..', 'dist');

/**
 * Removes dist\ and everything in it; does nothing when it is missing.
 */
function cleanDist(): void {
  rmSync(distPath, { recursive: true, force: true });
}

cleanDist();
