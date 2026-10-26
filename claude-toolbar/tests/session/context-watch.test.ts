/**
 * Tests the context watch on fake files: it reports the newest transcript's size of all open folders at start, a
 * change reports again after the refresh time with the changes meanwhile joining that one read, a first chat's new
 * transcript folder is found and watched, no transcript reports undefined, and dispose stops every watch and the
 * waiting read.
 */

import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextWatch } from '../../src/session/context-watch';
import { FakeTranscriptFiles } from '../helpers/fake-transcript-files';

const projects = join('C:\\Users\\me', '.claude', 'projects');
const agentFolder = join(projects, 'c--Repos-agent');
const toolsFolder = join(projects, 'C--Repos-tools');

/**
 * Writes a transcript's text holding one assistant record of a size.
 * @param tokens the size, all as cache-read tokens
 * @returns the text
 */
function withSize(tokens: number): string {
  return `${JSON.stringify({ type: 'assistant', message: { usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: tokens } } })}\n`;
}

describe('ContextWatch', () => {
  let files: FakeTranscriptFiles;
  let reports: (number | undefined)[];
  let watch: ContextWatch;

  beforeEach(() => {
    vi.useFakeTimers();
    files = new FakeTranscriptFiles();
    reports = [];
    files.addFolder(projects, ['c--Repos-agent', 'C--Repos-tools', 'c--Repos-closed']);
    files.addFolder(agentFolder);
    files.addFolder(toolsFolder);
    watch = new ContextWatch(files, {
      projectsFolder: projects,
      workspacePaths: ['c:\\Repos\\agent', 'c:\\Repos\\tools'],
      refreshMs: () => 1000,
      tailBytes: () => 4096,
      report: (tokens) => reports.push(tokens),
    });
  });

  afterEach(() => {
    watch.dispose();
    vi.useRealTimers();
  });

  it("reports the newest transcript's size of the open folders at start, and watches their folders", () => {
    files.writeTranscript(join(agentFolder, 'old.jsonl'), 100, withSize(50_000));
    files.writeTranscript(join(toolsFolder, 'new.jsonl'), 200, withSize(212_400));
    files.writeTranscript(join(projects, 'c--Repos-closed', 'newest.jsonl'), 300, withSize(9_000));
    watch.start();
    expect([reports, files.tailReads, files.watchedFolders()]).toEqual([
      [212_400],
      [{ path: join(toolsFolder, 'new.jsonl'), bytes: 4096 }],
      [projects, agentFolder, toolsFolder],
    ]);
  });

  it('reports again one refresh time after a change, the changes meanwhile joining that one read', () => {
    files.writeTranscript(join(agentFolder, 'chat.jsonl'), 100, withSize(50_000));
    watch.start();
    files.writeTranscript(join(agentFolder, 'chat.jsonl'), 101, withSize(51_000));
    files.change(agentFolder);
    vi.advanceTimersByTime(600);
    files.change(agentFolder);
    vi.advanceTimersByTime(399);
    const beforeRefresh = [...reports];
    vi.advanceTimersByTime(1);
    expect([beforeRefresh, reports]).toEqual([[50_000], [50_000, 51_000]]);
  });

  it("finds and watches a first chat's new transcript folder after a change in the projects folder", () => {
    files.addFolder(projects, ['c--Repos-agent']);
    files.folders.delete(agentFolder);
    watch.start();
    files.addFolder(projects, ['c--Repos-agent', 'C--Repos-tools']);
    files.writeTranscript(join(toolsFolder, 'first.jsonl'), 100, withSize(30_000));
    files.change(projects);
    vi.advanceTimersByTime(1000);
    expect([reports, files.watchedFolders()]).toEqual([[undefined, 30_000], [projects, toolsFolder]]);
  });

  it('reports undefined when there is no transcript', () => {
    watch.start();
    expect(reports).toEqual([undefined]);
  });

  it('stops every watch and the waiting read on dispose', () => {
    watch.start();
    files.change(agentFolder);
    watch.dispose();
    vi.advanceTimersByTime(1000);
    expect([reports, files.watchedFolders()]).toEqual([[undefined], []]);
  });
});
