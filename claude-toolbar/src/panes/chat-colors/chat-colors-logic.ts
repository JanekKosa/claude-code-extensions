/**
 * The logic behind the Chat colors page. It answers every message of the page with the state the page shows (each
 * part's color in the user's `workbench.colorCustomizations`, or none), after doing what the message asks: save a
 * color for a part (from the wheel or the hex field) or remove it (Default). A save changes one key of the user's
 * (Global) `workbench.colorCustomizations` and nothing else (settings\color-customizations.ts). Messages are carried out
 * one at a time, each reading the setting as it starts, so two quick saves never undo one another. A write VS Code
 * refuses, or a setting that holds no object, is shown as one error. The state is also sent whenever the setting
 * changes elsewhere. A message the page cannot have sent changes nothing and gets no answer.
 */

import type { PaneHost, PanePage } from '../../host/pane';
import type { Disposable } from '../../host/toolbar-host';
import { vscodeWorkbench } from '../../host/vscode-workbench';
import type { RejectedColor, StateMessage } from '../../media/chat-colors-protocol';
import { customizedColor, withThemeColor } from '../../settings/color-customizations';
import { toolbarTitle } from '../../toolbar/identity';
import { errorText } from '../../utils/error-text';
import { typedHexColor } from '../../utils/hex-color';
import { type Enqueue, serialQueue } from '../../utils/serial-queue';
import { type ChatPartDefinition, chatParts, partNamed } from './chat-parts';

/** A message of the page as the logic reads it: the part it names already looked up. */
type Request =
  | { readonly type: 'ready' }
  | { readonly type: 'save'; readonly part: ChatPartDefinition; readonly color: string }
  | { readonly type: 'useDefault'; readonly part: ChatPartDefinition };

/** The setting the pane reads and changes. */
const customizationsSetting = vscodeWorkbench.colorCustomizationsSetting;

// ---------------------------------------------------------------------------------------------------------------
// Connecting
// ---------------------------------------------------------------------------------------------------------------

/**
 * Connects the logic to the Chat colors page.
 * @param page the page
 * @param host where settings are read, written and watched, and errors shown
 * @returns what disconnects it: the settings watch and the message listener stop
 */
export function connectChatColors(page: PanePage, host: PaneHost): Disposable {
  const enqueue = serialQueue();
  const watch = host.watchSettings([customizationsSetting], () => page.post(stateMessage(host)));
  const listening = page.onMessage((message) => void answer(page, host, enqueue, request(message)));
  return {
    dispose: () => {
      watch.dispose();
      listening.dispose();
    },
  };
}

/**
 * Does what a message of the page asks, after every message before it, then sends the page the state.
 * @param page the page
 * @param host the logic's host
 * @param enqueue the queue the messages are carried out in
 * @param asked the message as read, or undefined for one the page cannot have sent
 * @returns when the state is sent; nothing is sent for undefined
 */
async function answer(page: PanePage, host: PaneHost, enqueue: Enqueue, asked: Request | undefined): Promise<void> {
  if (asked === undefined) return;
  await enqueue(async () => page.post(stateMessage(host, await carryOut(host, asked))));
}

// ---------------------------------------------------------------------------------------------------------------
// What the messages ask
// ---------------------------------------------------------------------------------------------------------------

/**
 * Does what a message asks.
 * @param host the logic's host
 * @param asked the message as read
 * @returns the rejected text, when the message saved a text that is not a color
 */
async function carryOut(host: PaneHost, asked: Request): Promise<RejectedColor | undefined> {
  switch (asked.type) {
    case 'ready':
      return undefined;
    case 'save':
      return saveColor(host, asked.part, asked.color);
    case 'useDefault':
      await writeColor(host, asked.part, undefined);
      return undefined;
  }
}

/**
 * Saves a color as the page sent it: from the wheel, or as typed (spaces around it, no #, either case).
 * @param host the logic's host
 * @param part the part it is for
 * @param text the color as sent
 * @returns the rejection, when the text is not six hex digits; nothing is written then
 */
async function saveColor(host: PaneHost, part: ChatPartDefinition, text: string): Promise<RejectedColor | undefined> {
  const color = typedHexColor(text);
  if (color === null) return { part: part.part, text };
  await writeColor(host, part, color);
  return undefined;
}

/**
 * Sets or removes a part's theme color in the user's (Global) `workbench.colorCustomizations`, merged into what the
 * setting holds now, and writes only when that changes it. When the merge or the write fails, shows one error.
 * @param host the logic's host
 * @param part the part
 * @param color the color, or undefined to remove the user's color
 * @returns when written, or nothing to write, or the error shown; never rejects
 */
async function writeColor(host: PaneHost, part: ChatPartDefinition, color: string | undefined): Promise<void> {
  try {
    const write = withThemeColor(host.readUserSetting(customizationsSetting), part.colorId, color);
    if (write.changes) await host.writeSettings({ [customizationsSetting]: write.value }, 'global');
  } catch (error) {
    host.showError(`${toolbarTitle} could not save the ${part.label.toLowerCase()} color: ${errorText(error)}`);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The messages
// ---------------------------------------------------------------------------------------------------------------

/**
 * Builds the state the page shows, from the setting's current value in the user's settings.
 * @param host where the setting is read
 * @param rejected the rejected text to report, if any
 * @returns the state message
 */
function stateMessage(host: Pick<PaneHost, 'readUserSetting'>, rejected?: RejectedColor): StateMessage {
  const customizations = host.readUserSetting(customizationsSetting);
  return {
    type: 'state',
    parts: chatParts.map(({ part, colorId }) => ({ part, color: customizedColor(customizations, colorId) })),
    ...(rejected === undefined ? {} : { rejected }),
  };
}

/**
 * Reads a message of the page: one of the three the page sends (chat-colors-protocol.d.ts), with a known part and,
 * to save, a color as text.
 * @param value the message as it arrived
 * @returns the message, or undefined when it is none of them
 */
function request(value: unknown): Request | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const { type, part, color } = value as Record<string, unknown>;
  if (type === 'ready') return { type };
  const named = partNamed(part);
  if (named === undefined) return undefined;
  if (type === 'useDefault') return { type, part: named };
  if (type === 'save' && typeof color === 'string') return { type, part: named, color };
  return undefined;
}
