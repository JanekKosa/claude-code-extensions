/**
 * The media folder: the files a pane's page may load, and no others (the host limits every page to it). The build
 * fills it: tsconfig.webview.json compiles src\media\*.ts into it, and scripts\copy-media.ts copies there the other
 * files of src\media and the libraries scripts\media-files.ts names.
 */

/** The media folder under the extension's folder, outermost first. */
export const mediaFolder = ['dist', 'media'] as const;

/** iro.js, the color wheel library: the build copies it into the media folder unmodified (MPL-2.0). */
export const iroScriptFile = 'iro.min.js';

/** iro.js's license text (MPL-2.0), copied from its package beside it. */
export const iroLicenseFile = 'iro.min.js.LICENSE.txt';
