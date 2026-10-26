/**
 * Shows the Claude chat's context size in the toolbar: a context watch over the open folders' transcripts, whose
 * every size sets the context key that picks the context size's look (buttons\context-size.ts). With no folder open
 * there is no chat to follow, and the look stays at 0k.
 */

import { contextSizeValue } from '../buttons/context-size';
import type { Disposable, ToolbarHost } from '../host/toolbar-host';
import { contextRefreshMs, contextTailBytes } from '../settings/owned-settings';
import type { OwnedSetting } from '../toolbar/contracts';
import { contextSizeKey } from '../toolbar/identity';
import { ContextWatch } from './context-watch';
import type { TranscriptFiles } from './transcript-files';

/** VS Code's command that sets a context key. */
const setContextCommand = 'setContext';

/**
 * Starts following the context size.
 * @param host the toolbar's host: the open folders, the settings, and the command that sets the key
 * @param files the file access
 * @param projectsFolder Claude's projects folder
 * @returns what stops it
 */
export function startContextDisplay(host: ToolbarHost, files: TranscriptFiles, projectsFolder: string): Disposable {
  const workspacePaths = host.workspaceFolderPaths();
  if (workspacePaths.length === 0) return { dispose: () => undefined };
  const watch = new ContextWatch(files, {
    projectsFolder,
    workspacePaths,
    refreshMs: () => numberSetting(host, contextRefreshMs),
    tailBytes: () => numberSetting(host, contextTailBytes),
    report: (tokens) => void host.runCommand(setContextCommand, contextSizeKey, contextSizeValue(tokens)),
  });
  watch.start();
  return watch;
}

/**
 * Reads a number setting the toolbar owns.
 * @param host the toolbar's host
 * @param owned the setting
 * @returns its value, or its default when it holds no number
 */
function numberSetting(host: ToolbarHost, owned: OwnedSetting<number>): number {
  const value = host.readSetting(owned.key);
  return typeof value === 'number' ? value : owned.default;
}
