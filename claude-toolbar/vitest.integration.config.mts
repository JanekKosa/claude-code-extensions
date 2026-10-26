/**
 * The integration tests (`npm run test:integration`): only tests\**\*.integration.test.ts, which read real
 * installed software (Claude's VS Code extension) without changing it. One test worker.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.integration.test.ts'],
    maxWorkers: 1,
  },
});
