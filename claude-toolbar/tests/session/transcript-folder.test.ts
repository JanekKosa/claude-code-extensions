/**
 * Tests the names of Claude's folders: the projects folder (moved by CLAUDE_CONFIG_DIR), a workspace folder's
 * transcript folder name, and finding it whatever the case of its drive letter.
 */

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { claudeProjectsFolder, findProjectFolder, projectFolderName } from '../../src/session/transcript-folder';

describe("Claude's folders", () => {
  it('puts the projects folder in ~\\.claude, or in CLAUDE_CONFIG_DIR when set', () => {
    expect([claudeProjectsFolder(undefined, 'C:\\Users\\me'), claudeProjectsFolder('', 'C:\\Users\\me'), claudeProjectsFolder('D:\\claude', 'C:\\Users\\me')]).toEqual([
      join('C:\\Users\\me', '.claude', 'projects'),
      join('C:\\Users\\me', '.claude', 'projects'),
      join('D:\\claude', 'projects'),
    ]);
  });

  it('names a transcript folder with every character but a letter or digit made -', () => {
    expect(projectFolderName('c:\\Repos\\My projects\\xpp-agent')).toBe('c--Repos-My-projects-xpp-agent');
  });

  it('finds the transcript folder whatever the case, and nothing when there is none', () => {
    const existing = ['C--Repos-other', 'C--Repos-My-projects-xpp-agent'];
    expect([findProjectFolder(existing, 'c:\\Repos\\My projects\\xpp-agent'), findProjectFolder(existing, 'c:\\Repos\\new')]).toEqual([
      'C--Repos-My-projects-xpp-agent',
      undefined,
    ]);
  });
});
