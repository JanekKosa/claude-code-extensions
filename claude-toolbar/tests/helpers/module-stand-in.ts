/**
 * Makes Node's own module loader answer a bare specifier with an object of the test's choosing, for code a test
 * loads with require() instead of through vitest (vitest's alias reaches only the imports vitest itself
 * transforms, never a require call inside a compiled file). Uses Node's synchronous customization hooks
 * (module.registerHooks), which every require() and import goes through. Generic: knows nothing of the toolbar.
 */

import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** A stand-in in place: what removes it. */
export interface StandIn {
  /** Removes the hooks; the specifier resolves as it did before. */
  remove(): void;
}

/**
 * Makes `require(specifier)` and `import specifier` give the stand-in object, until removed. The hooked module
 * finds the object through a global, which is how Node's documentation passes values from the hooks to the
 * modules they load. No file is read from the stand-in's URL.
 * @param specifier the bare specifier, such as `vscode`
 * @param standIn the object the module's exports become
 * @returns what removes the stand-in
 */
export function standInForModule(specifier: string, standIn: object): StandIn {
  const key = Symbol.for(`module-stand-in:${specifier}`);
  const url = pathToFileURL(join(tmpdir(), `${specifier}.stand-in.cjs`)).href;
  const source = `module.exports = globalThis[Symbol.for(${JSON.stringify(key.description)})];`;
  (globalThis as Record<symbol, unknown>)[key] = standIn;
  const hooks = registerHooks({
    resolve: (requested, context, nextResolve) =>
      requested === specifier ? { url, format: 'commonjs', shortCircuit: true } : nextResolve(requested, context),
    load: (loaded, context, nextLoad) => (loaded === url ? { format: 'commonjs', source, shortCircuit: true } : nextLoad(loaded, context)),
  });
  return {
    remove: () => {
      hooks.deregister();
      delete (globalThis as Record<symbol, unknown>)[key];
    },
  };
}
