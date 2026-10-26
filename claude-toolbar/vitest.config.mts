/**
 * The unit tests (`npm test`): everything under tests\ except the integration tests, in one test worker. The
 * module 'vscode' exists only inside VS Code, so it is aliased to the fake in tests\fakes\vscode.ts (an alias
 * applies to imports, never to require calls).
 */

import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'tests/**/*.integration.test.ts'],
    alias: { vscode: fileURLToPath(new URL('./tests/fakes/vscode.ts', import.meta.url)) },
    maxWorkers: 1,
  },
});
