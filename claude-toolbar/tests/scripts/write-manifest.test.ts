/**
 * Tests that package.json is in step with the buttons and the panes: its commands, menus, view containers, views and
 * settings are exactly what `npm run manifest` builds from them.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildContributes } from '../../src/toolbar/manifest';
import { toolbarDefinition } from '../../scripts/toolbar-definition';
import { packageJsonPath } from '../helpers/paths';

describe('package.json', () => {
  it('is in step with the buttons and the panes', () => {
    const { commands, menus, viewsContainers, views, configuration } = (JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { contributes: Record<string, unknown> })
      .contributes;
    expect({ commands, menus, viewsContainers, views, configuration }, 'package.json is out of step with the buttons: run npm run manifest').toStrictEqual(
      buildContributes(toolbarDefinition),
    );
  });
});
