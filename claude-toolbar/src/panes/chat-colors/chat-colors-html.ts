/**
 * The Chat colors page's HTML: at the top a two-way switch (one button per part of the chat), below it the place of
 * the color wheel, the hex field, Default and the problem line, then a note on what else follows the two colors, the
 * stylesheet, iro.js and the page's script. Every file comes from the media folder through the URLs the host gives, and
 * the content security policy lets in nothing else: the stylesheet only from the page's own source, scripts only from
 * the tags that carry this page's nonce.
 */

import type { PageResources } from '../../host/pane';
import { themeColorVariable } from '../../host/vscode-workbench';
import { iroScriptFile } from '../media';
import { type ChatPartDefinition, chatParts } from './chat-parts';

/** The page's stylesheet in the media folder (copied there from src\media). */
export const stylesheetFile = 'chat-colors.css';

/** The page's script in the media folder (compiled there from src\media\chat-colors-page.ts). */
export const pageScriptFile = 'chat-colors-page.js';

/** The pane's title: its tab's in the panel, and the page's. */
export const chatColorsTitle = 'Chat colors';

/**
 * Builds the page.
 * @param resources the media URLs, the policy's source and the nonce
 * @returns the HTML
 */
export function chatColorsHtml(resources: PageResources): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    `<meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(resources)}">`,
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<link rel="stylesheet" href="${resources.mediaUrl(stylesheetFile)}">`,
    `<title>${chatColorsTitle}</title>`,
    '</head>',
    '<body>',
    '<div class="switch" role="radiogroup" aria-label="The color to set">',
    ...chatParts.map(partButton),
    '</div>',
    '<div class="picker">',
    '<div class="wheel"></div>',
    '<div class="fields">',
    '<label>Color <input class="hex" type="text" spellcheck="false" autocomplete="off"></label>',
    '<button class="default" type="button" title="Remove your color, so the theme\'s own shows">Default</button>',
    '<p class="problem" role="alert"></p>',
    '</div>',
    '</div>',
    '<p class="note">The thinking lines\' color is also VS Code\'s grey hint text everywhere else.</p>',
    `<script nonce="${resources.nonce}" src="${resources.mediaUrl(iroScriptFile)}"></script>`,
    `<script type="module" nonce="${resources.nonce}" src="${resources.mediaUrl(pageScriptFile)}"></script>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/**
 * Builds the page's content security policy: nothing by default, the stylesheet from the page's own source, and
 * only the script tags that carry the nonce.
 * @param resources the policy's source and the nonce
 * @returns the policy
 */
function contentSecurityPolicy(resources: PageResources): string {
  return [`default-src 'none'`, `style-src ${resources.cspSource}`, `script-src 'nonce-${resources.nonce}'`].join('; ');
}

/**
 * Builds one part's button of the switch. The page's script finds the part by data-part, reads the theme's own color
 * from the CSS variable data-color-variable names, and fills in the swatch and the value.
 * @param definition the part
 * @returns the button's HTML
 */
function partButton(definition: ChatPartDefinition): string {
  return [
    `<button class="part" type="button" role="radio" aria-checked="false" data-part="${definition.part}" data-color-variable="${themeColorVariable(definition.colorId)}">`,
    `<span class="swatch"></span><span class="name">${definition.label}</span><span class="value"></span>`,
    '</button>',
  ].join('');
}
