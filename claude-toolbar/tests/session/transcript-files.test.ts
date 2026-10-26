/**
 * Tests the file access on Node's real file system, in a temporary folder: sub-folders and transcripts listed apart
 * (only `.jsonl` files), the end of a file read up to a byte count, a watch hearing a new file, and a missing folder
 * or file answering empty.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nodeTranscriptFiles } from '../../src/session/transcript-files';

describe('nodeTranscriptFiles', () => {
  let folder: string;

  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), 'claude-toolbar-transcripts-'));
    mkdirSync(join(folder, 'session-1', 'subagents'), { recursive: true });
    writeFileSync(join(folder, 'session-1.jsonl'), 'first line\nlast line\n');
    writeFileSync(join(folder, 'notes.txt'), 'not a transcript');
  });

  afterEach(() => {
    rmSync(folder, { recursive: true, force: true });
  });

  it('lists the sub-folders and the transcripts directly in a folder apart', () => {
    const transcripts = nodeTranscriptFiles.transcripts(folder);
    expect([nodeTranscriptFiles.folderNames(folder), transcripts.map((file) => file.path), transcripts[0].modifiedMs > 0]).toEqual([
      ['session-1'],
      [join(folder, 'session-1.jsonl')],
      true,
    ]);
  });

  it('reads the end of a file up to a byte count, or the whole of a shorter file', () => {
    const path = join(folder, 'session-1.jsonl');
    expect([nodeTranscriptFiles.readTail(path, 10), nodeTranscriptFiles.readTail(path, 1000)]).toEqual(['last line\n', 'first line\nlast line\n']);
  });

  it('hears a new file in a watched folder', async () => {
    const heard = new Promise<void>((resolve) => {
      const watch = nodeTranscriptFiles.watch(folder, () => {
        watch?.dispose();
        resolve();
      });
    });
    writeFileSync(join(folder, 'session-2.jsonl'), '{}\n');
    await expect(heard).resolves.toBeUndefined();
  });

  it('answers empty for a missing folder or file', () => {
    const missing = join(folder, 'missing');
    expect([
      nodeTranscriptFiles.folderNames(missing),
      nodeTranscriptFiles.transcripts(missing),
      nodeTranscriptFiles.readTail(join(missing, 'a.jsonl'), 10),
      nodeTranscriptFiles.watch(missing, () => undefined),
    ]).toEqual([[], [], '', undefined]);
  });
});
