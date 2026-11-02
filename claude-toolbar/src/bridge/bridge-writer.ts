/**
 * Writes the bridge file, which carries the band settings to the chat-colors mod (version 2 of the contract, in
 * chat-colors\README.md): `{"colors":{"prompt":"#4FA3E0","notes":"#D29922","answer":null},"tintPercent":15}`. The file
 * follows the settings: it is written when the toolbar starts, whenever one of them changes, and by this writer alone.
 * Writes run one at a time, each reading the settings as it starts, so the last change always wins. A write that fails
 * is shown as one error.
 */

import type { Disposable, ToolbarHost } from '../host/toolbar-host';
import { answerBandColor, bandTintPercent, notesBandColor, promptBandColor } from '../settings/owned-settings';
import type { OwnedSetting } from '../toolbar/contracts';
import { toolbarTitle } from '../toolbar/identity';
import { atomicWrite, type RenameRetry } from '../utils/atomic-write';
import { errorText } from '../utils/error-text';
import { normalizedHexColor } from '../utils/hex-color';
import { serialQueue } from '../utils/serial-queue';

/** What the writer uses of the host: the settings, and where a failed write is shown. */
export type BridgeHost = Pick<ToolbarHost, 'readSetting' | 'watchSettings' | 'showError'>;

/**
 * How long a write tries while a reader holds the file. The mod reads it for a moment, every half second by default;
 * a reader polling flat out made 163 retries in 200 writes, and none failed (measured 2026-10-23).
 */
const renameRetry: RenameRetry = { attempts: 10, delayMs: 50 };

/** The settings the file follows. */
const bridgeSettings: readonly OwnedSetting[] = [promptBandColor, notesBandColor, answerBandColor, bandTintPercent];

/**
 * Writes the file now, and again whenever a setting it follows changes.
 * @param host the toolbar's host
 * @param path the bridge file's path
 * @returns what stops following the settings
 */
export function startBridgeWriter(host: BridgeHost, path: string): Disposable {
  const enqueue = serialQueue();
  const write = (): void => void enqueue(() => writeBridge(host, path));
  write();
  return host.watchSettings(bridgeSettings.map((owned) => owned.key), write);
}

/**
 * Writes the file with what the settings hold now. When that fails, shows one error.
 * @param host the toolbar's host
 * @param path the bridge file's path
 * @returns when written, or the error shown; never rejects
 */
async function writeBridge(host: BridgeHost, path: string): Promise<void> {
  try {
    await atomicWrite(path, bridgeText(host), renameRetry);
  } catch (error) {
    host.showError(`${toolbarTitle} could not write the chat colors to ${path}: ${errorText(error)}`);
  }
}

/**
 * Builds the file's text. A tint outside the contract is written as it is: the mod reads it as its default.
 * @param host where the settings are read
 * @returns one line of JSON
 */
function bridgeText(host: Pick<BridgeHost, 'readSetting'>): string {
  const colors = {
    prompt: bandColor(host, promptBandColor),
    notes: bandColor(host, notesBandColor),
    answer: bandColor(host, answerBandColor),
  };
  return `${JSON.stringify({ colors, tintPercent: host.readSetting(bandTintPercent.key) })}\n`;
}

/**
 * Reads one band's color.
 * @param host where the setting is read
 * @param owned the band's setting
 * @returns the color as `#RRGGBB`; null for no band, when the setting holds no color
 */
function bandColor(host: Pick<BridgeHost, 'readSetting'>, owned: OwnedSetting<string>): string | null {
  return normalizedHexColor(host.readSetting(owned.key));
}
