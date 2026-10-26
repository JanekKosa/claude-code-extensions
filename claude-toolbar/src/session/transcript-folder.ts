/**
 * Where Claude Code keeps the transcripts of a folder's chats: `<Claude's folder>\projects\<the folder's path with
 * every character but a letter or digit made ->`, such as `c--Repos-My-projects-xpp-agent` for
 * `c:\Repos\My projects\xpp-agent`. One `<session id>.jsonl` per chat sits directly in it; subagents' transcripts sit
 * in sub-folders.
 */

import { join } from 'node:path';

/**
 * Names Claude's projects folder.
 * @param configDir the CLAUDE_CONFIG_DIR environment variable, which moves Claude's folder when set
 * @param homeDir the user's home folder
 * @returns `<configDir or homeDir\.claude>\projects`
 */
export function claudeProjectsFolder(configDir: string | undefined, homeDir: string): string {
  return join(configDir || join(homeDir, '.claude'), 'projects');
}

/**
 * Names the transcript folder of a workspace folder, as Claude Code names it.
 * @param workspacePath the workspace folder's path
 * @returns the folder's name inside the projects folder
 */
export function projectFolderName(workspacePath: string): string {
  return workspacePath.replace(/[^a-zA-Z0-9]/g, '-');
}

/**
 * Finds a workspace folder's transcript folder among the folders that exist. The drive letter's case differs
 * between VS Code and a terminal (`c--Repos` and `C--Repos`), so the match ignores case.
 * @param existing the names of the projects folder's sub-folders
 * @param workspacePath the workspace folder's path
 * @returns the existing name, or undefined when Claude has no chat there yet
 */
export function findProjectFolder(existing: readonly string[], workspacePath: string): string | undefined {
  const wanted = projectFolderName(workspacePath).toLowerCase();
  return existing.find((name) => name.toLowerCase() === wanted);
}
