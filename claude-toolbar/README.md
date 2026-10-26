# Claude Toolbar

Buttons at the top right of the Claude Code chat in VS Code.

- They show in Claude's chat in the side bar (either side bar) and in a Claude chat opened as an editor tab.
- From left to right: the context size (text, such as `212k`), the chat-view button, then the palette button.
- More buttons can be added, one small file each: see "Add a button".

## The context size

The text left of the buttons is the chat's context size: how many tokens Claude's context held after its latest
step, in thousands. A chat at 212,400 tokens shows `212k`.

- It follows Claude's transcript of the chat (`~\.claude\projects\<folder>\<session id>.jsonl`, or under
  `CLAUDE_CONFIG_DIR` when that is set). After each of Claude's steps it reads the end of the transcript again and
  adds up the latest step's input, cache-creation and cache-read tokens. A step stopped by an error writes zeros;
  those steps are skipped.
- It counts the main chat only. Subagents have transcripts of their own; the agents pane of `agents-pane\` shows
  theirs.
- It shows `0k` until Claude has answered in the chat once, and when no folder is open in the window.
- It shows `1000k+` from a million tokens up.
- With several Claude chats open in one window, every chat shows the size of the chat Claude wrote to last. VS Code
  does not tell an extension which transcript belongs to which chat.
- A click does nothing.
- How it works: a command's title is fixed in `package.json`, so the toolbar has one command per value (`0k` to
  `1000k+`, 1001 of them), each without an icon. The extension sets the context key `claudeToolbar.contextK` to the
  size in thousands, and only the command for that value shows. `npm run manifest` writes the 1001 commands; the
  range and step are `contextSizeScale` in `src\buttons\context-size.ts`.

## The chat-view button

It switches Claude's own Focus view on and off. Take one turn in which Claude reads 3 files, runs 2 commands and
answers:

```text
EVERYTHING            FOCUS VIEW
You: why is X?        You: why is X?
 [3 file reads]        [Claude's work, folded] >
 [command 1]          Claude: because...
 [command 2]
Claude: because...
```

The button's look shows the view you are in. Its tooltip says what a click does.

| Icon | View | Tooltip |
| --- | --- | --- |
| eye | everything | Chat shows everything. Click for Focus view (Claude's work folded). |
| speech bubble | Focus view | Chat in Focus view (Claude's work folded). Click to show everything. |

- A click switches to the other view. It writes Claude's setting `claudeCode.focusView` in your user settings, and
  nothing else.
- Ctrl+Alt+F, Claude's own Focus view key, does the same. The icon follows, so it always shows the view you are in.

## The palette button and the Chat colors pane

The palette button shows the "Chat colors" pane at the bottom of VS Code, where the Terminal sits. A second click
hides it again.

- Hiding it hides the whole bottom panel, as VS Code's "Hide Panel" does. Nothing in the panel is closed: a terminal
  there keeps running.
- If you drag the pane out of the bottom panel, the button still hides the bottom panel. Drag the pane back.

In the pane you set two colors of the Claude chat:

- **Prompt outline**: the thin outline around the box where you type your prompt.
- **Thinking lines**: the "Thought for 4s" lines and the text of Claude's thinking.

The pane has:

- A switch at the top: Prompt outline | Thinking lines. It picks the part you set, and shows each part's color, or
  "theme default" when you have set none.
- A color wheel with a lightness slider. A color is saved when you let go of the wheel.
- A hex field, such as `#4FA3E0`, that follows the wheel. Type a color and press Enter or leave the field to save it.
  The `#` may be left out. Anything that is not six hex digits is not saved, and the pane says so.
- Default: removes your color, so the theme's own shows again. It is saved at once.

## Where the colors are saved

The pane saves VS Code theme colors in your user settings, under `workbench.colorCustomizations`: the setting VS Code
itself offers for changing a theme's colors. The chat follows at once.

| Part | Theme color | What else follows it |
| --- | --- | --- |
| Prompt outline | `inlineChatInput.border` | The outline of VS Code's own inline chat box. Almost nothing else. |
| Thinking lines | `descriptionForeground` | VS Code's grey hint text everywhere: setting descriptions, hints, other secondary text. |

- Example: you pick `#4FA3E0` for the thinking lines. Your settings.json then holds
  `"workbench.colorCustomizations": { "descriptionForeground": "#4FA3E0" }`, and VS Code's grey hint text turns
  blue too.
- A save changes only that one key. Every other color in `workbench.colorCustomizations`, and every block for one
  theme only (such as `"[Monokai]": {...}`), stays as it was.
- A block for one theme wins over the pane's color while that theme is on.
- To undo: click Default for each part, or delete the keys `inlineChatInput.border` and `descriptionForeground` from
  `workbench.colorCustomizations` in your settings.json. When Default leaves nothing in the setting, it removes the
  setting.
- If `workbench.colorCustomizations` holds something other than an object, the pane saves nothing and shows an error.

## Settings

The toolbar declares two settings of its own, for the context size, under "Claude Toolbar":

| Setting | Default | What it does |
| --- | --- | --- |
| `claudeToolbar.contextRefreshMs` | 1000 | How long to wait after Claude writes to the transcript before reading the size again, in milliseconds. Writes during the wait join it, so the size changes at most once per wait. |
| `claudeToolbar.contextTailBytes` | 4194304 (4 MB) | How many bytes of the transcript's end are read to find the latest size. Raise it if the size shows `0k` while Claude answers with very long tool results. |

It writes two settings of other owners, in your user settings: `claudeCode.focusView` (Claude's, for the chat-view
button) and `workbench.colorCustomizations` (VS Code's, for the Chat colors pane).

## Add a button

Each button is one small file. `npm run manifest` writes its commands and menu entries into `package.json`, so you
never type them there by hand.

1. Create the button's file in `src\buttons\`, named in kebab-case, such as `src\buttons\open-settings.ts`.
2. In it, export the button: an id (camelCase, unique in the toolbar) and its looks. A look has an id, an icon, a
   tooltip, when it shows, and what a click does.
3. In `src\buttons\index.ts`, import the button and append it to the list `toolbarButtons`. The list's order is the
   order of the buttons from left to right.
4. Create its test in `tests\buttons\`, with the same name and `.test.ts`, such as
   `tests\buttons\open-settings.test.ts`.
5. Run `npm run manifest`. It writes the button's command and menu entries into `package.json`.
6. Run `npm run typecheck`, then `npm test`. Every test must pass.

The tests check every button for you: unique ids, a tooltip on every look, an icon that exists, and exactly one look
showing at a time.

### Example: a button that opens VS Code's Settings

`src\buttons\open-settings.ts`:

```ts
/**
 * The open-settings button: opens VS Code's Settings.
 */

import { runCommand } from '../actions/run-command';
import type { ToolbarButton } from '../toolbar/contracts';
import { always } from '../utils/when-clause';

/** The open-settings button: one look, always shown. */
export const openSettingsButton: ToolbarButton = {
  id: 'openSettings',
  looks: [
    {
      id: 'open',
      icon: 'gear',
      tooltip: "Open VS Code's Settings.",
      when: always,
      onClick: runCommand('workbench.action.openSettings'),
    },
  ],
};
```

In `src\buttons\index.ts`, the new import and the list:

```ts
import { openSettingsButton } from './open-settings';

export const toolbarButtons: readonly ToolbarButton[] = [chatViewButton, chatColorsButton, openSettingsButton];
```

`tests\buttons\open-settings.test.ts`:

```ts
/**
 * Tests the open-settings button: a click opens VS Code's Settings.
 */

import { describe, expect, it } from 'vitest';
import { openSettingsButton } from '../../src/buttons/open-settings';
import { FakeButtonHost } from '../helpers/fake-button-host';

describe('the open-settings button', () => {
  it("opens VS Code's Settings on a click", async () => {
    const host = new FakeButtonHost();
    await openSettingsButton.looks[0].onClick(host);
    expect(host.commands).toStrictEqual([{ commandId: 'workbench.action.openSettings', args: [] }]);
  });
});
```

After `npm run manifest`, `package.json` holds the command `claudeToolbar.openSettings`. It shows at `navigation@3`
(the third button) in both places, and it is hidden from the Command Palette.

### Good to know

- Icons are VS Code's codicons, named without `$( )`, such as `gear`. The full list is
  `node_modules\@vscode\codicons\dist\codicon.csv`, column `short_name`.
- A look without an icon shows its tooltip as text in the title bar: VS Code draws any title-bar item that has no
  icon as its title (seen in VS Code 1.141's `workbench.desktop.main.js`: `label:!e.class&&!e.item.icon`). The
  context size uses this.
- A look's `when` adds to the place's own condition. `always` shows the look wherever the toolbar shows.
- A button with one look gets the command `claudeToolbar.<buttonId>`. A button with several looks gets one command per
  look, `claudeToolbar.<buttonId>.<lookId>`.
- A button whose look follows a setting has one look per state, each shown by its own condition. VS Code gives
  extensions no "toggled" button. The chat-view button builds its two looks from one table with `viewCycleButton`:
  see `src\buttons\chat-view.ts`.
- Ready-made click actions are in `src\actions\`: `runCommand` runs a VS Code command, `writeSettings` writes
  settings, `togglePane` shows or hides a pane (a tab of the bottom panel with a page of its own, such as Chat colors).
- A pane is one folder in `src\panes\`, listed in `src\panes\index.ts`: its page's HTML and the logic behind the page.
  `npm run manifest` declares its view. The page may load only the files of `dist\media`, which the build fills from
  `src\media`.
- A setting of the button's own goes in `src\settings\owned-settings.ts`. `npm run manifest` declares it in
  `package.json`.
- A click that fails shows one error: `Clicking "<tooltip>" failed: <the reason>`.

## Build, test, package

Run these in this folder (`claude-toolbar\`).

- `npm run build`: writes the manifest, compiles `src\` into `dist\` (the pages' scripts in `src\media` separately,
  for the browser), then copies the other files of `src\` and iro.js into `dist\`.
- `npm run typecheck`: type-checks the sources, the pages' scripts, the tests and the scripts.
- `npm test`: the unit tests.
- `npm run test:integration`: checks against real files without changing them. It checks that Claude's installed
  extension still has every id the toolbar uses, loads the built `dist\` as VS Code does, and checks what the package
  holds. Run `npm run build` or `npm run package` first.
- `npm run package`: removes `dist\`, builds, and writes `claude-toolbar.vsix` in this folder. The package holds only
  `dist\`, `package.json` and `README.md` (`.vscodeignore` says so).
- To check a built package: unzip `claude-toolbar.vsix` (rename it to `.zip` first), set the environment variable
  `CLAUDE_TOOLBAR_FOLDER` to the unzipped `extension` folder, and run `npm run test:integration`.
- Install: `code --install-extension claude-toolbar.vsix`. The same command replaces a copy already installed: VS Code
  1.141 reinstalls it with or without `--force`.
- To check the copy VS Code runs: set `CLAUDE_TOOLBAR_FOLDER` to
  `%USERPROFILE%\.vscode\extensions\janekkosa.claude-toolbar-<version>` and run `npm run test:integration`. It passes
  only when that copy's `dist\`, `package.json` and `readme.md` are this folder's build.
- The package has no LICENSE file and no `repository` field yet. `npm run package` packs without them.

## Credits

- The color wheel is [iro.js](https://github.com/jaames/iro.js) 5.5.2 by James Daniel, licensed under the Mozilla
  Public License 2.0 (MPL-2.0). The package ships its file `iro.min.js` unmodified, with its license text beside it
  (`dist\media\iro.min.js.LICENSE.txt`).
- `iro.min.js` also holds [Preact](https://preactjs.com) (MIT license, copyright Jason Miller) and
  [@irojs/iro-core](https://github.com/irojs/iro-core) (MPL-2.0), bundled into it by iro.js's author.
- `dist\media\THIRD-PARTY-NOTICES.txt` names all three, with their licenses and where their source code is.
