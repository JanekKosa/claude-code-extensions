/**
 * Tests the Chat colors page's HTML: its content security policy (nothing by default, the stylesheet from the page's
 * source, scripts only with the nonce), every file loaded through the host's media URLs and nothing inline, iro.js
 * loaded before the page's module script, the switch at the top with its two parts in order (each naming the CSS
 * variable of its theme color), then the wheel, the hex field, Default, the problem line and the note.
 */

import { describe, expect, it } from 'vitest';
import type { PageResources } from '../../../src/host/pane';
import { chatColorsHtml } from '../../../src/panes/chat-colors/chat-colors-html';

/** Resources whose URLs say which media file they name. */
const resources: PageResources = {
  mediaUrl: (fileName) => `https://media.test/${fileName}`,
  cspSource: 'https://media.test',
  nonce: 'bm9uY2Utb2YtdGhlLXRlc3Q=',
};

/** The page. */
const html = chatColorsHtml(resources);

/**
 * Lists every match of a pattern's first group.
 * @param pattern the pattern, global
 * @returns the matches
 */
function all(pattern: RegExp): string[] {
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

describe('the Chat colors page', () => {
  it('has a content security policy allowing nothing by default, styles from its source and scripts with the nonce', () => {
    expect(all(/<meta http-equiv="Content-Security-Policy" content="([^"]*)">/g)).toEqual([
      "default-src 'none'; style-src https://media.test; script-src 'nonce-bm9uY2Utb2YtdGhlLXRlc3Q='",
    ]);
  });

  it('loads iro.js, then its own script as a module, each with the nonce', () => {
    expect(all(/(<script[^>]*>)/g)).toEqual([
      '<script nonce="bm9uY2Utb2YtdGhlLXRlc3Q=" src="https://media.test/iro.min.js">',
      '<script type="module" nonce="bm9uY2Utb2YtdGhlLXRlc3Q=" src="https://media.test/chat-colors-page.js">',
    ]);
  });

  it('loads every file through a media URL, and has no inline script, style or handler', () => {
    expect(all(/(?:src|href)="([^"]*)"/g)).toEqual(['https://media.test/chat-colors.css', 'https://media.test/iro.min.js', 'https://media.test/chat-colors-page.js']);
    expect([/<script(?![^>]*\ssrc=)[^>]*>/.test(html), /<style/.test(html), /\sstyle=/.test(html), /\son[a-z]+=/.test(html)]).toEqual([false, false, false, false]);
  });

  it("starts with the switch: Prompt outline, then Thinking lines, each naming its theme color's CSS variable", () => {
    const body = html.slice(html.indexOf('<body>'));
    expect(body.startsWith('<body>\n<div class="switch" role="radiogroup"')).toBe(true);
    expect([all(/data-part="([^"]*)"/g), all(/data-color-variable="([^"]*)"/g), all(/<span class="name">([^<]*)<\/span>/g)]).toEqual([
      ['promptOutline', 'thinkingLines'],
      ['--vscode-inlineChatInput-border', '--vscode-descriptionForeground'],
      ['Prompt outline', 'Thinking lines'],
    ]);
  });

  it('has, below the switch, the wheel, the hex field, Default and the problem line', () => {
    const parts = ['class="wheel"', 'class="hex"', 'class="default"', 'class="problem"'];
    const after = html.slice(html.indexOf('</div>', html.indexOf('class="switch"')));
    expect(parts.filter((part) => !after.includes(part))).toEqual([]);
  });

  it('says that the thinking lines\' color is also VS Code\'s grey hint text', () => {
    expect(all(/<p class="note">([^<]*)<\/p>/g)).toEqual(["The thinking lines' color is also VS Code's grey hint text everywhere else."]);
  });

  it('is titled Chat colors', () => {
    expect(all(/<title>([^<]*)<\/title>/g)).toEqual(['Chat colors']);
  });
});
