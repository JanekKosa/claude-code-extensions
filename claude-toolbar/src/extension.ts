/**
 * The extension's entry point. VS Code calls activate shortly after it starts (activationEvents
 * onStartupFinished). It registers every look of every toolbar button as a command, and every pane, whose page VS Code
 * builds when it first shows the pane, and starts following the chat's context size. Everything it registers goes
 * into the extension's subscriptions, which VS Code disposes when the extension stops.
 */

import { homedir } from 'node:os';
import type * as vscode from 'vscode';
import { toolbarButtons } from './buttons';
import { VscodeHost } from './host/vscode-host';
import { toolbarPanes } from './panes';
import { startContextDisplay } from './session/context-display';
import { nodeTranscriptFiles } from './session/transcript-files';
import { claudeProjectsFolder } from './session/transcript-folder';
import { registerButtons } from './toolbar/registration';

/**
 * Starts the toolbar.
 * @param context the extension's context; its subscriptions, and its folder, where panes find their media files
 */
export function activate(context: Pick<vscode.ExtensionContext, 'subscriptions' | 'extensionUri'>): void {
  const host = new VscodeHost(context.extensionUri);
  const projectsFolder = claudeProjectsFolder(process.env.CLAUDE_CONFIG_DIR, homedir());
  context.subscriptions.push(
    ...registerButtons(host, toolbarButtons),
    ...toolbarPanes.map((pane) => host.registerPane(pane)),
    startContextDisplay(host, nodeTranscriptFiles, projectsFolder),
  );
}
