/**
 * Tests the choice of the newest installed extension folder: versions compare by number, a platform suffix is
 * allowed, and folders of other extensions are ignored.
 */

import { describe, expect, it } from 'vitest';
import { newestExtensionFolder } from './extension-folders';

describe('newestExtensionFolder', () => {
  it('compares versions by number and allows a platform suffix', () => {
    const folders = ['anthropic.claude-code-2.1.306-win32-x64', 'anthropic.claude-code-2.1.1000', 'anthropic.claude-code-2.0.999-win32-x64'];
    expect(newestExtensionFolder(folders, 'anthropic.claude-code')).toBe('anthropic.claude-code-2.1.1000');
  });

  it('ignores folders of other extensions and folders without a version', () => {
    const folders = ['anthropic.claude-code-insiders-9.9.9', 'other.claude-code-9.9.9', 'anthropic.claude-code-2.1.306-win32-x64', 'extensions.json'];
    expect(newestExtensionFolder(folders, 'anthropic.claude-code')).toBe('anthropic.claude-code-2.1.306-win32-x64');
    expect(newestExtensionFolder(['extensions.json'], 'anthropic.claude-code')).toBeUndefined();
  });
});
