# Chat view — worker brief

The brief every worker (and every task lead) of the chat-view work reads. **Read it by section**: your task
message names the sections you need. Sections 1 to 6 bind everyone; sections 7 and 8 are reference.

Repo: `C:\Repos\My projects\claude-code-extensions` (written "the repo" below). Started 2026-10-23 by the main
session, which talks to the user (Jan).

## 1. What this is

The user works in Claude Code's chat inside VS Code. Scrolling back to find their own earlier prompt is slow,
because Claude's tool calls and thinking fill the chat. They asked for a button at the top right of the Claude
chat that switches what the chat shows. Their words:

- "a toggle of three options, one that shows everything like now, one that shows thinking and one that doesn't
  show thinking or actions"
- "I don't want to turn off thinking, I just don't want it to show in the user output"
- "it will be a toolbar also for other tools I want to add later"
- about the filter: "build the filter too and test it hard, when it's done add it to the toggle"

The three views of the chat, for one turn in which Claude thinks, reads 3 files, thinks, runs 2 commands,
thinks, and answers:

```
1 EVERYTHING          2 THINKING             3 ANSWERS
You: why is X?        You: why is X?         You: why is X?
 Thought for 4s >      Thought for 4s >      Claude: because...
 [3 file reads]        Thought for 2s >
 Thought for 2s >      Thought for 3s >
 [command 1]          Claude: because...
 [command 2]
 Thought for 3s >
Claude: because...
```

View 3 is built in two steps. **Now**: it is Claude's own Focus view, where each stretch of work folds into one
line the user can click open. **Later**: once the chat filter (component C) has passed every test, view 3 becomes
"answers only" as drawn above.

Three components, one folder each:

| Folder | Kind | Job |
| --- | --- | --- |
| `claude-toolbar\` (A) | VS Code extension, TypeScript | The toolbar on the Claude chat and its first button, which cycles the three views. Owns the settings. Writes the bridge file (8.2). |
| `hide-actions\` (B) | Claude Code mod, TypeScript/TSX | Removes tool-call rows from the VS Code chat while the bridge file says `hideActions`. |
| `chat-filter\` (C) | Windows program, C# (.NET 10) | VS Code starts it instead of Claude. It starts the real Claude and passes everything through, except that it keeps thinking out of what reaches the chat while the bridge file says `hideThinking`. Claude itself still thinks and keeps its thinking. |

The user's decisions so far (2026-10-23):

- The code lives in this repo, which the user will push to GitHub as `claude-code-extensions`; one folder per
  extension.
- Toolbar buttons: **one small file per button**; the build writes VS Code's menu entries into `package.json` from
  those files, so the places a button shows and its looks are never typed by hand.
- View 3: Focus view for now; the filter is built, tested hard, then switched in (8.6).
- Thinking stays on. Turning thinking off was offered and refused.

## 2. Who you answer to

**Who you answer to.** A task lead plans one task and wrote your task message. **You report to your lead and to
nobody else.** The message that started you gives you the lead's id; if it names no lead, the main session is
your lead (`main`). Where this brief speaks of checking your work or keeping the shared notes, that is the lead.

- **Your summary, your conclusions and your questions go to your lead**, with `SendMessage` to the lead's id
  (load the tool with `ToolSearch`, `select:SendMessage`, if it is only listed by name). The message wakes the
  lead. Send messages to no other id: `ListAgents` also shows the user's other sessions, and none of them is
  yours to write to.
- **When you are done**: write the whole report to the file your task message names, send the lead
  `WORKER DONE | <run> | report: <path>` with a summary of at most 150 words under it, and end your turn. Your
  final message is exactly the one line `Reported to the lead.` It goes to the main session, which does not read
  reports; do not repeat the report in it.
- **When you are stuck on something you may not decide** (a decision that is the user's, a file that is not
  yours, a conflict between two instructions): do everything that does not depend on it first, then send the lead
  `QUESTION FOR THE LEAD | <one line>` with the question in plain words and one worked example, and end your turn
  with exactly `Waiting for the lead.` The lead's answer wakes you. Never decide for the user, and never ask the
  user yourself: the lead decides what goes further up.
- **You cannot see the size of your own context; the main session can, and watches it.** The cap is 500
  thousand, and a worker reaches 400 thousand after about 100 tool calls whatever the task. When the main
  session's warning comes, **stop building and start closing**: about 25 tool calls are left, and they belong to
  your progress file, the type-check, the suite and the report. A long real-data run is started before the
  warning or not at all. In a mutation run: finish the batch you are in, record which mutants ran and which did
  not, and never leave a source file changed.
- **Write your progress file after every point**, not at the end, so the lead can see how far you are and a
  cut-off loses nothing.
- Count your tool calls as your task message says, and do not re-read a file you have already read.

## 3. Hard rules

- **Never reload a VS Code window, restart its extension host, or stop `Code.exe` or any `claude.exe` you did not
  start yourself.** The user's chats, including the main session running this work, live inside them.
- **Never edit anything under `%USERPROFILE%\.vscode\extensions\`** (Claude's installed extension or any other).
  Reading is fine.
- **Never change the user's real configuration**: VS Code's `settings.json` and `keybindings.json`
  (`%APPDATA%\Code\User\`), `~\.claude\settings.json`, `~\.claude.json`, Claude Code plugins and marketplaces,
  the real bridge file `%USERPROFILE%\.claude\claude-code-extensions\chat-view.json`. Tests use temp folders.
  Installing or switching on anything (the `.vsix`, the mod, the filter, `claudeCode.claudeProcessWrapper`) is
  the main session's job: ask through your lead.
- **Never write to `C:\Repos\My projects\xpp-agent`** (another repo). Reading is fine.
- **Never commit, push, or change git config.**
- **One heavy command at a time** (npm install, a build, a test run, `dotnet build/test`, `vsce`). Check free
  memory before each: `"{0:N1} GB" -f ((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1MB)`. Below
  1.0 GB free, wait a minute and check again; if it stays low, ask your lead. Run tests with one test worker.
- **Real `claude.exe` runs** use the user's account and cost money: only in the chat-filter task, only as its
  task message allows, with short prompts.
- **Never print or store secrets.** Never dump environment variables; they may hold credentials.

## 4. Repo layout

```
claude-code-extensions\
├─ README.md, .gitignore
├─ .claude-plugin\marketplace.json   (task B) lists hide-actions so `claude plugin install` finds it
├─ claude-toolbar\                    (task A) VS Code extension
├─ hide-actions\                      (task B) Claude Code mod
├─ chat-filter\                       (task C) Windows program
├─ misc\implementation\chat-view\     this brief, the lead brief, status, sizes, lead files (committed)
└─ temp\chat-view\                    task, progress and report files (never committed; may be wiped)
```

What exists before the first run (2026-10-23): the root `README.md` and `.gitignore`;
`claude-toolbar\package.json` with its devDependencies installed (`node_modules\` present): `@types/node`
^26.0.1, `@types/vscode` 1.140.0 (exact on purpose: it must stay at or below `engines.vscode` ^1.140.0),
`@vscode/codicons` 0.0.46-24, `@vscode/vsce` ^4.0.0, `tsx` ^4.21.0, `typescript` ^7.0.2, `vitest` ^4.1.4. Its
scripts `manifest`, `build`, `typecheck`, `test`, `test:integration` are declared; the files they use do not
exist yet, and its `contributes` is `{}`. Nothing else is built. The repo is a git repository with no commits.

## 5. Code rules

The user's rules (from their other repo's instructions; they bind this repo too):

- Every file starts with a header comment saying what it is for. Every class and every method has a comment
  header saying what it does: in TypeScript a JSDoc block, with `@param` and `@returns` on every exported
  function; in C# a `///` XML doc comment.
- Group methods by meaning, with a heading comment above each group.
- Each method does exactly one thing, and its name says what. Split a method that does two.
- A generic helper that knows nothing of this feature goes to a utility file (`utils\`).
- Imports and usings at the top of the file.
- **Never hardcode a configurable or domain-dependent value** (an interval, a limit, a size, a list a user might
  change): make it configuration with a default. Protocol constants (ids of Claude's extension, the bridge file's
  place) live once, in one named place, with a comment naming who else relies on them.
- No dead code, no debugging leftovers, no unused imports. When a signature changes, update every caller.
- No needless complexity: no try/catch or checks without a purpose. (The filter's fail-open rule in 8.5 is a
  purpose.)
- Architecture that keeps feature code small: depend on interfaces, pass dependencies in, keep each module to one
  job.
- Library first: before writing anything non-trivial, look for an established library. Before using a library or
  tool, read its current documentation (fetch it; do not rely on memory).
- TypeScript file and folder names in kebab-case; C# follows .NET naming (PascalCase files and types).
- Tests mirror the source layout.

## 6. Working rules

- Keep the progress file your task message names, from your first step; update it after every point.
- Read the clock (`Get-Date`) for every time you write down; never guess a time.
- Before the final checks, write "The contract" (what other code may rely on) and "For the next run" into your
  progress file.
- The shell is PowerShell 7. The Bash tool may fail to start; do not rely on it.
- Git: the one on PATH (`C:\Program Files\Git\cmd\git.exe`) is broken on this machine. Use
  `C:\Program Files\Microsoft Visual Studio\18\Enterprise\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd\git.exe`.
- Long output goes to a file under `temp\chat-view\`; read its tail. Never pipe a running program into
  `Select-Object -First N` (it kills the program mid-run).
- Before writing a file that exists, read it. Never overwrite a file you did not create in this run without
  saying so in your report.

## 7. Facts established (with where they came from)

Everything here was verified on this machine on 2026-10-23 by the main session, unless marked "to confirm".

### 7.1 VS Code 1.141

- VS Code 1.141.0 at `C:\Users\user\AppData\Local\Programs\Microsoft VS Code`; the CLI `code` is on PATH
  (`...\bin\code.cmd`). User extensions live in `%USERPROFILE%\.vscode\extensions`, whose `extensions.json` is
  the registry: an extension is installed with `code --install-extension <file.vsix> --force`, never by copying
  a folder (and only by the main session).
- An extension's menu item accepts `command`, `alt`, `when`, `group` (and `submenu`); a command accepts
  `command`, `title`, `shortTitle`, `category`, `icon`, `enablement`. Source: this build's own message strings in
  `resources\app\out\nls.messages.json`. **There is no `toggled` property for extensions**: a button whose look
  follows a state is one command per state, each shown by its own when-clause.
- `group: "navigation"` in `view/title` and `editor/title` puts the item as an icon at the top right; other
  groups go under the "..." menu. `navigation@<n>` orders items.
- Icons are written `"$(codicon-name)"`. `eye-closed` exists in this build's codicon table.
- When-clauses: `config.<setting>` reads any setting as a context value (Claude's own extension uses
  `config.claudeCode.useTerminal`); `&&`, `||`, `!`, parentheses (Claude's extension uses
  `!(listFocus && listSupportsFind)`), `==`, `=~`. `view == <id>` targets a view's title bar;
  `activeWebviewPanelId == '<viewType>'` targets a webview editor tab.
- Since VS Code 1.74 a contributed command activates its extension by itself. `onStartupFinished` activates an
  extension shortly after startup.
- `@types/vscode` 1.140.0 is the newest published; `engines.vscode` must be at or above it (vsce checks).
- `@vscode/vsce` 4.0.0 needs Node 22 or later. Its documentation names no flag for a missing LICENSE or
  `repository` field: read `npx vsce package --help` before packaging, because a prompt hangs a tool call.

### 7.2 Claude's VS Code extension (`anthropic.claude-code-2.1.306-win32-x64`)

Read from its `package.json` and `extension.js` under `%USERPROFILE%\.vscode\extensions\`.

- **Where the chat lives.** Side bar views `claudeVSCodeSidebar` (container `claude-sidebar`, used when the
  editor has no secondary side bar) and `claudeVSCodeSidebarSecondary` (container `claude-sidebar-secondary`).
  `claudeVSCodeSessionsList` is the sessions list, not a chat. A chat opened as an editor tab is a webview panel
  of view type `claudeVSCodePanel`; Claude's own when-clauses use `activeWebviewPanelId == 'claudeVSCodePanel'`.
  Claude contributes no `view/title` items; its `editor/title` items are the diff accept/reject buttons and an
  "open Claude" logo.
- **Focus view.** Setting `claudeCode.focusView`: boolean, default false, scope `application`. Its description:
  "hide tool calls and other in-progress activity in the chat, showing only your prompts and Claude's responses.
  Folded activity stays one click away, and a live indicator names the tool currently running." The command
  `claude-vscode.toggleFocusView` (key `ctrl+alt+f`) runs `setFocusView(!getFocusView())`, which is
  `workspace.getConfiguration("claudeCode").update("focusView", value, ConfigurationTarget.Global)`. The extension
  watches `claudeCode.focusView` and pushes every change to every open chat at once (`syncFocusViewToChannels`).
  **So another extension writing that setting switches the open chats.**
- **Process wrapper.** Setting `claudeCode.claudeProcessWrapper` (string): "Executable path used to launch the
  Claude process". Verified in run C1 (`temp\chat-view\C1_REPORT.md` section 1): with it set, `Zk` returns
  `{pathToClaudeCodeExecutable: <wrapper>, executableArgs: [<bundled claude.exe>]}`, and both the extension's own
  starts (`w7`) and the chats' spawn run **`<wrapper> <bundled claude.exe> <claude args...>`**: no shell,
  `windowsHide: true`, three pipes, cwd = the chat's folder, env = the extension host's plus
  `claudeCode.environmentVariables` plus `CLAUDE_CODE_ENTRYPOINT=claude-vscode`, `MCP_CONNECTION_NONBLOCKING=true`,
  `CLAUDE_CODE_ENABLE_TASKS=0`, `CLAUDE_CODE_EMIT_STARTUP_TIMING=1`, minus `CLAUDECODE`, `CLAUDE_CODE_CHILD_SESSION`,
  `TRACEPARENT`, `TRACESTATE`. When no bundled `claude.exe` exists, the path argument is missing and the first
  argument is already a flag. Flags with values come as one argument (`--max-thinking-tokens=31999`), but
  `--output-format stream-json` comes as two. It is used for every Claude the extension starts: chats, `auth
  status --json` (the start check, a telemetry probe), `auth logout`, `--claude-in-chrome-mcp`, worktree create and
  clean-up, the settings subcommands (`edit-hook`, `edit-permission-rules`, MCP and plugin commands...); not
  terminal mode (which runs `claude` from PATH); the extension never runs `--version`. It checks nothing before
  the start; after a failed start it says "Claude Code could not be started from <path> (file not found |
  permission denied | not a program this computer can run)", and reads the first bytes only to name a wrong
  build. A wrapper must be a real `.exe` (no shell). A change of the setting applies to Claude processes started
  afterwards; running chats keep theirs. **Setting it changes the extension too**: a chat without an explicit
  permission mode gets `default`; the extension no longer records the process id at spawn (`noteSpawnedProcess`),
  which would be the wrapper's; the sessions list includes programmatic sessions; telemetry and the update check
  are off ("a process wrapper is configured").
- **Stopping, history, thinking flags** (run C1). A turn is stopped with an `interrupt` control request; a closed
  chat gets its stdin closed, then TerminateProcess after 2 + 5 s, so only a job object takes a wrapped Claude
  down; a non-zero exit shows "Claude Code process exited with code N" plus the stderr tail. A reopened chat's
  earlier turns are read from the transcript file by the extension: they never pass through stdout or a wrapper.
  Thinking is always `--max-thinking-tokens=31999`; `--thinking-display=summarized` is added only when Claude's
  `showThinkingSummaries` setting is true.
- **The Claude it runs** is `...\anthropic.claude-code-2.1.306-win32-x64\resources\native-binary\claude.exe`
  (2.1.306). `%USERPROFILE%\.local\bin\claude.exe` is an older 2.1.286: do not use it for anything that depends
  on the version. A chat's command line, read from a live process:

  ```
  claude.exe --output-format stream-json --verbose --input-format stream-json --max-thinking-tokens=<n>
    --permission-prompt-tool=stdio --setting-sources=user,project,local --permission-mode=auto
    --include-partial-messages --debug --debug-to-stderr --enable-auth-status --no-chrome --replay-user-messages
  ```

  So stdout carries newline-delimited JSON (stream-json) including partial `stream_event` lines, stdin carries
  stream-json from the extension, and stderr carries the debug log.
- **Claude Code settings** (`claude-code-settings.schema.json` in the extension): `viewMode` is one of `default`,
  `verbose`, `focus` (no "answers only" mode exists); `showThinkingSummaries` (boolean); `alwaysThinkingEnabled`
  (false switches thinking off: refused by the user).

### 7.3 How the chat draws its rows (`webview\index.js` of 2.1.306)

- The chat asks the Claude engine (`engine_ui_render`) to draw these sites whenever a loaded mod hooks them:
  AbovePrompt, Pane, AskUserQuestion, UserMessage, AssistantMessage, ToolUse, ToolResult, ToolGroup,
  CommandOutput, Spinner.
- **A tool-call row disappears completely when a mod draws it empty.** The tool row component (`aK`) renders
  `null` when the mod's tree holds no engine node (`qW` false) and draws nothing visible (`GW` false). `GW` is:
  a string → not blank; `engine` → false; fragment → any child visible; Box or Text → has a `borderStyle` string,
  a `backgroundColor`, or a visible child; Markdown → text not blank; Code → source not blank; any other element
  → true. When the tool row is replaced, the chat does not ask for its ToolResult at all.
- **Grouped reads.** The chat merges runs of consecutive successful `Read` calls into one row
  ("ReadCoalesced", result text "Successfully read N files"), drawn through the ToolGroup site. An empty,
  engine-less tree there also renders `null`.
- **Thinking is drawn by the chat itself, never by a mod.** Component `m10` draws "Thinking..." while it runs and
  "Thought for Ns" after, as a collapsible line; a static line when the thinking text is empty. In non-Anthropic
  builds (`window.IS_ANT` false) every message is its own row, so thinking is never part of a group. The
  AssistantMessage site is only asked for assistant messages with non-blank text, and a replaced AssistantMessage
  still draws its thinking blocks. **No mod and no setting can hide thinking.**
- Focus view's folded lines are drawn by the chat (`Ek0`, with a live indicator `hk0`): not mod sites.
- A message with no content draws nothing (`yk`: `if (J.isEmpty) return null`). For the filter: an assistant
  message stripped of all its blocks draws nothing.

### 7.4 Claude Code mods (the plugin API of 2.1.306)

- The `plugin-authoring` skill was loaded by the main session, and its files are copied into the repo at
  `temp\chat-view\plugin-authoring\`: `reference.md` (the long form, 75 KB: read by section),
  `examples\` (`band.tsx`, `pane.tsx`, `pane.test.tsx`, `tool-call.ts`, `band-state.d.ts`, `pane-state.d.ts`),
  `types\claude-code.d.ts` (about 22,000 lines: grep it for the name at hand, never read it whole). The
  original, `C:\Users\user\AppData\Local\Temp\claude\bundled-skills\2.1.306\c7f13e18caab1a20b3fc22d18e71ba72\plugin-authoring\`,
  is temporary and may be gone.
- A mod is a folder with `.claude-plugin\plugin.json`, `hooks\hooks.json` (`{ "modules": ["./register.tsx"] }`),
  and `hooks\register.tsx` exporting `register: Register = (on, options) => { ... }`. Values kept in `$.state`
  are declared in `types\index.d.ts` (named in `plugin.json` as `"types"`).
- `ui.render` props are in `RenderPropsOf` in the types. ToolUse: `tool_use_id`, `tool`, `input`, `isRunning`,
  `isErrored`, `isInterrupted`, `isExpanded?`, `output?`, `onScreen?`. ToolResult: `tool_use_id`, `tool`,
  `output`, `isErrored`, `isExpanded?`. ToolGroup: `calls`, `isActive`, `isExpanded`, `isCallsOnly?`. All three
  are raised on every surface; `e.surface` is `terminal`, `desktop`, `vscode` or `mobile`. A hook returns a tree,
  or `next(e)` for the engine's own drawing. Elements come from `$.ui.resolve(e)`.
- State: `atom`, `read`, `update` from `'claude-code'`. A `read` while drawing subscribes that row, and an
  `update` from a timer redraws exactly those rows: the view switches live.
- Files and timers: `$.fs.read(path)` (rejects when missing), `$.fs.stat`, `$.fs.exists`;
  `$.env.get("USERPROFILE")` (the name must be a string literal); `$.clock.every(ms, fn)`. Options: `userConfig`
  fields in `plugin.json`, read from `pluginConfigs` in settings.
- Checks: `claude plugin validate <dir>`; `claude plugin test <dir>` runs the mod's `*.test.ts(x)` against the
  engine (`claude-code/testing`); type-check with the `tsconfig.json` printed in the types file's header, kept
  outside the mod folder. Use the 2.1.306 `claude.exe` (7.2).
- Installing for every session (main session only): the repo-root `.claude-plugin\marketplace.json` lists the mod
  with `"source": "./hide-actions"`; then `claude plugin marketplace add <repo>` and
  `claude plugin install hide-actions@claude-code-extensions`. A marketplace that is a folder is read from the
  folder itself, so later edits reach sessions after `/reload-plugins`.

### 7.5 The machine

- Windows 10 Enterprise LTSC 2019, 7.8 GB RAM, often only about 2 GB free (VS Code and Copilot helpers hold much
  of it). Node 24.13.0, npm 11.6.2. .NET SDK 9.0.308 and 10.0.400; .NET runtimes 8, 9 and 10. Visual Studio 2026
  Enterprise.
- PowerShell traps from the user's global instructions: variable names are case-insensitive (`$p` overwrites
  `$P`); `-replace`, `-match`, `-split` are case-insensitive (use `-creplace`, `-cmatch`); a `foreach` statement
  cannot be piped (assign it first); a native argument starting with `-` that holds a variable must be quoted
  whole; an argument holding `&` is cut when it goes through a `.cmd` shim; the Write and Edit tools store a
  `\uXXXX` escape as the literal character.

## 8. Design

### 8.1 The three views and the button

| View | `claudeCode.focusView` | `claudeToolbar.hideActions` | `claudeToolbar.hideThinking` (from 8.6) | The chat shows |
| --- | --- | --- | --- | --- |
| everything | false | false | false | everything |
| thinking | false | true | false | prompts, Claude's text, thinking lines; no tool rows |
| answers, now | true | false | (not yet) | prompts, Claude's text, one folded line per stretch of work |
| answers, after 8.6 | false | true | true | prompts and Claude's text only |

- One button, three looks (icon and tooltip), one per view. **The look shows the current view; the tooltip says
  what a click does.** Proposed (the lead reports the final choice as a decision): everything `$(eye)` "Chat:
  everything. Click to hide Claude's actions."; thinking `$(lightbulb)` "Chat: thinking, no actions. Click for
  answers only."; answers `$(comment)` "Chat: answers only (Focus view). Click to show everything."
- A click cycles everything → thinking → answers → everything, by writing the next view's settings (Global
  target).
- **The current view is derived from the settings in a fixed order, first match wins**: answers if
  `claudeCode.focusView`; thinking if `claudeToolbar.hideActions`; else everything. (After 8.6: answers if
  `claudeToolbar.hideThinking`; thinking if `hideActions`; else everything.) Each look's when-clause and the
  derivation in code come from **one ordered table**, so they cannot disagree; a test checks that every
  combination of the settings shows exactly one look. Ctrl+Alt+F (Claude's own Focus view key) changes
  `focusView`, and the derived look follows, so the icon stays right.
- Without component B installed, view 2 looks like view 1: the README says so.

### 8.2 The bridge file (the contract between A, B and C)

- **Path**: `<home>\.claude\claude-code-extensions\chat-view.json`. Home is `os.homedir()` in the toolbar,
  `$.env.get("USERPROFILE")` (falling back to `$.env.get("HOME")`) in the mod, and
  `Environment.GetFolderPath(Environment.SpecialFolder.UserProfile)` in the filter.
- **Content**: one JSON object, UTF-8 without BOM: `{"hideActions": <bool>, "hideThinking": <bool>}`. Until 8.6
  the toolbar writes only `hideActions`. Readers treat a missing field as false.
- **Writer**: the toolbar alone. It writes at activation and whenever a setting that feeds the bridge changes.
  Atomically: write `chat-view.json.<random>.tmp` in the same folder, then rename it over `chat-view.json`;
  create the folder when missing. Retry the rename a few times on EPERM, EBUSY or EACCES, since a reader may hold
  the file for an instant.
- **Readers** (mod, filter): file missing → every field false. File unreadable or not valid JSON → keep the last
  values read (a write may be under way) and try again at the next poll. The poll interval is configuration,
  default 500 ms. **Readers open, read and close at once, and never keep the file open.** Measured in run A2 on
  this machine (2026-10-23): a reader holding the file open blocks the toolbar's rename with EPERM until it closes
  it, even when it opened with `FileShare.ReadWrite | FileShare.Delete` (an earlier version of this brief said the
  opposite; that was wrong). The toolbar's retries absorb short holds: a reader polling flat out caused 163
  retries in 200 writes, 0 failed writes, 0 torn reads; with no reader, 0 retries. A test that polls the file in
  a tight loop while the toolbar writes can starve the writer.
- **Tests never touch the real file**: each component takes the path, or the home folder, from its own
  configuration or host, so a test points it at a temp folder.

### 8.3 Component A: `claude-toolbar` (VS Code extension)

Shape, following the user's "one small file per button":

```
src\extension.ts          activate(): registers every button's commands and the bridge writer
src\toolbar\              contracts (button, state look, owned setting), places, manifest builder, registration
src\host\                 the host interfaces; vscode-host.ts (the only file besides extension.ts that imports
                          'vscode'); claude-extension.ts (every id we rely on from Claude's extension, in one place)
src\actions\              reusable button actions: run a command, write settings
src\bridge\               the bridge file: its path and its writer
src\buttons\<name>.ts     one file per button; index.ts lists them in toolbar order. APPEND new ones.
src\settings\             the settings the toolbar owns: key, default, description, bridge field
src\utils\                generic helpers (when-clauses, error text, atomic file write)
scripts\write-manifest.ts writes contributes.commands, .menus and .configuration into package.json
tests\                    mirrors src\; tests\fakes\vscode.ts stands in for 'vscode' (vitest test.alias)
```

- **Places**: `view/title` with `view == claudeVSCodeSidebar || view == claudeVSCodeSidebarSecondary`;
  `editor/title` with `activeWebviewPanelId == 'claudeVSCodePanel'`. Group `navigation@<n>`, `n` from the list
  order. Every toolbar command is hidden from the Command Palette (`commandPalette` entry with when `false`).
- **Command ids**: `claudeToolbar.<buttonId>` for a button with one look, `claudeToolbar.<buttonId>.<stateId>`
  for each state look. Category "Claude Toolbar".
- **Owned settings** under `contributes.configuration` (title "Claude Toolbar"): `claudeToolbar.hideActions`,
  boolean, default false, scope `application`, a plain-words description. `claudeToolbar.hideThinking` arrives in
  8.6.
- `activationEvents`: `["onStartupFinished"]`.
- **Errors**: one place, the registration, catches a failing action and shows `<tooltip>: <message>` with
  `window.showErrorMessage`.
- **Two host interfaces**: ButtonHost (what an action may do: run a command, read a setting, write settings) and
  ToolbarHost (adds: register a command, watch settings, write a file atomically, the home folder, show an error).
- **Tests** (vitest): the manifest builder; `package.json` in step with the buttons (failing with "run npm run
  manifest"); registration and its error path; the host adapter against the fake `vscode`; every button valid
  (unique camelCase ids, tooltips not empty, every icon a real codicon per `@vscode/codicons`, exactly one look per
  combination of settings); the chat-view derivation and cycle; the bridge writer in a temp folder (atomic,
  content, creates the folder, retries a busy rename); layering (only `extension.ts` and `host\vscode-host.ts`
  import `vscode`). An integration test (`*.integration.test.ts`, `npm run test:integration`) checks that the
  installed Claude extension (newest `anthropic.claude-code-*` folder) still has every id in
  `src\host\claude-extension.ts`.
- **Packaging**: `npm run package` builds `claude-toolbar.vsix` in the folder (git-ignored) holding only `dist\`,
  `package.json` and `README.md` (check with `vsce ls`). Installing it is the main session's.
- **README**: what it does (the three views, drawn), how to add a button (the steps), build, test and package
  commands, and where the bridge file is and who reads it.

### 8.4 Component B: `hide-actions` (Claude Code mod)

- While the bridge says `hideActions`, on the `vscode` surface (a configurable list, default `vscode`), the
  ToolUse, ToolResult and ToolGroup hooks return an empty Box (no children, no border, no background): the chat
  then drops the row (7.3). Otherwise they return `next(e)`.
- Drawn as usual even then: a row with `e.props.isExpanded === true`, and tools named in the `alwaysShow` option
  (default `AskUserQuestion,ExitPlanMode`: the question card and the plan are answers, not actions).
- State: one `$.state` value, `hideActions` (boolean), declared in `types\index.d.ts`. `session.start` reads the
  bridge once and starts `$.clock.every(pollMs)` (option, default 500), which re-reads it and `update`s the value
  only when it changed. The render hooks `read` it, so a change redraws the rows at once.
- Options (`userConfig`): `pollMs`, `surfaces`, `alwaysShow`, typed as the API's `userConfig` rules allow.
- Tests (`claude plugin test`): hidden → an empty tree for each of the three sites; shown → the engine's drawing;
  `alwaysShow`; other surfaces untouched; `isExpanded` drawn; a bridge change while running redraws (mocked
  clock); missing file → shown; invalid JSON → the previous value kept. Plus `claude plugin validate` clean and
  the type-check clean.
- The repo-root `.claude-plugin\marketplace.json`: `"name": "claude-code-extensions"`, owner `JanekKosa`, one
  plugin `hide-actions` with source `./hide-actions`. Installing is the main session's.

### 8.5 Component C: `chat-filter` (Windows program)

- **C#, .NET 10 console app** (`net10.0`), published framework-dependent as a single file `chat-filter.exe`. Why
  C#: it must be a real `.exe` (7.2), and it must tie the real Claude's lifetime to its own with a Windows job
  object (kill on close), so that a stopped chat never leaves an orphaned Claude using memory on this machine;
  Node cannot create job objects without a native add-on. JSON through `System.Text.Json`. Tests with xUnit (or
  MSTest) from NuGet.
- **Start**: the extension runs `chat-filter.exe <claude.exe path> <claude arguments...>` (confirmed in run C1,
  7.2; when the path argument is missing, the filter fails clearly instead of running a flag as a program). The filter starts that program with the same arguments (`ProcessStartInfo.ArgumentList`, no shell), the
  same working folder and environment, all three streams redirected, and puts it in a job object with
  `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` before it can start children of its own (research the safe way).
- **Streams**: stdin and stderr are copied byte for byte, flushed as they arrive so the conversation stays live.
  stdout is copied byte for byte unless filtering applies. When the child exits: drain stdout and stderr, then
  exit with the child's exit code. When the filter's own stdin closes, close the child's.
- **Filtering applies only to chat sessions**: the arguments contain `--output-format stream-json` or
  `--output-format=stream-json`. Every other run (auth status, `--version`, MCP mode, worktree clean-up) is pure
  pass-through.
- **While the bridge says `hideThinking`** (polled; interval configurable, default 500 ms):
  - a line `{"type":"assistant","message":{"content":[...]}}`: remove the blocks of type `thinking` and
    `redacted_thinking` from `message.content`. Keep the line even when no block remains (an empty message draws
    nothing, 7.3, and its ids stay intact).
  - a line `{"type":"stream_event","event":{...}}`: per API message (each `message_start` starts afresh), drop
    the `content_block_start` of a thinking or redacted_thinking block and every `content_block_delta` and
    `content_block_stop` of that index; renumber the other blocks' indexes so they stay 0, 1, 2... in order.
  - The decision to filter is taken once per API message (at its `message_start`; for an `assistant` line, at the
    first sight of its message id), so a message is never half filtered when the view changes mid-message.
  - **The shapes in 2.1.306** (run C1; fixtures in `chat-filter\tests\ChatFilter.Tests\Fixtures\Claude-2.1.306\`):
    every `assistant` line carries one content block, and a message's lines share `message.id`; every
    `stream_event` line carries a top-level `api_message_id` equal to that id. Other lines (`assistant`,
    `system/*`, subagents' `user` lines) arrive between the stream events of one message, and a block's
    `assistant` line comes before its `content_block_stop`. Opus 5.5's thinking blocks have empty text and a
    signature (`"thinking_display":"updates"`); progress-update thinking blocks with 1-2 sentences can sit right
    before a `tool_use`, so thinking can follow a non-thinking block. `system/thinking_tokens` lines, token counts
    and `thinking_display` fields are left alone: the chat draws the live token count only inside a thinking row
    (`m10` in `webview\index.js`), so without the block nothing shows.
  - **Fail open**: a line that is not valid JSON, not one of these shapes, or unexpected in any way goes out
    unchanged, byte for byte. A line is re-serialized only when something was actually removed or renumbered;
    otherwise its original bytes go out.
  - Lines end with `\n`; a `\r` before it is kept; a last line without `\n` goes out as it is. Lines can be
    megabytes long. Work on bytes; never split a multi-byte UTF-8 character.
  - What thinking looks like in 2.1.306's stream-json **must be captured from the real CLI before the filter is
    written**, not assumed.
- **Logging**: errors only, to `%LOCALAPPDATA%\claude-code-extensions\chat-filter\logs\`, with a size cap. Never
  log message content.
- **Install** (main session only): publish to
  `%LOCALAPPDATA%\claude-code-extensions\chat-filter\<version>\chat-filter.exe` (a new folder per version, because
  running chats keep the old exe locked), then set `claudeCode.claudeProcessWrapper` to it. Rollback: clear the
  setting; new chats start Claude directly again.
- **Testing hard** (the user's words: "test it hard"):
  1. Unit: the line filter on fixtures captured from the real 2.1.306 CLI (sanitized: no paths, names or tokens)
     and on made-up edge cases: thinking first, in the middle, last; redacted_thinking; several thinking blocks;
     none; tool_use blocks; empty content; unknown event types; invalid JSON; JSON that is not an object; huge
     lines; a multi-byte character split across two reads; CRLF; no final newline; the view switched in the
     middle of a message.
  2. Process: with a fake child program (a small test exe that echoes stdin, writes known stdout and stderr and
     exits with a chosen code): byte-identical pass-through both ways; exit codes; large volumes without deadlock
     (stdout and stderr flooding while stdin is written); killing the filter kills the child and the child's own
     children.
  3. Real Claude through the filter (the bundled 2.1.306): `-p` with `--output-format stream-json --verbose
     --include-partial-messages`, and once with the extension's full argument list over `--input-format
     stream-json` for two user turns. View off: output the same in shape as a direct run. View on: no thinking or
     redacted_thinking anywhere, every message's indexes contiguous, the second turn answers correctly (Claude
     kept its thinking), and the session's transcript file still holds the thinking blocks. `--version` and
     `auth status --json` the same as direct runs.
  4. Mutation: break one rule at a time in a copy (stop renumbering, filter a non-thinking block, re-serialize an
     untouched line, leave out the job object, ...) and confirm a test catches each: N of N.
  5. In VS Code, by the main session with the user: wrapper set, a NEW chat, all three views, and nothing else
     changed (permission prompts, diffs, stopping a turn, resuming a session).

### 8.6 Switching view 3 to the filter (after C passes 8.5)

- Toolbar: add the owned setting `claudeToolbar.hideThinking` (bridge field `hideThinking`); the answers view
  becomes focusView false, hideActions true, hideThinking true; the derivation order becomes answers if
  `hideThinking`. Package; the main session installs.
- Main session: install the filter (8.5), set `claudeCode.claudeProcessWrapper`, and tell the user that chats
  already open keep running without the filter until reopened.

## 9. Traps

- The extension compiles to CommonJS (`package.json` has no `"type": "module"`), so code that `tsc` builds cannot
  use `import.meta`. Tests and scripts run through vitest and tsx; type-check them with a separate tsconfig.
- `vsce` prompts (LICENSE, `repository`) hang a tool call: read its `--help` first.
- `@types/vscode` must stay at or below `engines.vscode`.
- Claude's extension can rename its views or commands in an update: keep every id in one file and let the
  integration test catch a change.
- A `.cmd` or `.ps1` cannot be the wrapper (7.2).
- The installed filter exe is locked while any chat runs it: never build over the installed copy.
- Use the extension's bundled `claude.exe` (2.1.306), not `~\.local\bin\claude.exe` (2.1.286).
- Real Claude runs cost the user money: only as the task message allows.

## 10. Checking

Counts are filled in by the leads as they become known.

- A: `npm run typecheck`; `npm test`; `npm run test:integration`; `npm run package`, then `npx vsce ls`. After A1
  (2026-10-23): typecheck 0 errors; `npm test` 13 files, 82 tests; `npm run test:integration` 1 file, 4 tests.
  After A2: typecheck 0 errors; `npm test` 25 files, 154 tests, no Vite warning; `npm run test:integration` 1 file,
  4 tests. After A3: typecheck 0 errors; `npm test` 26 files, 163 tests, no Vite warning; `npm run package` exit 0,
  no prompt, `claude-toolbar.vsix` with 28 entries; `npm run test:integration` (needs a build first) 3 files, 12
  tests, also on the unpacked `.vsix` through `CLAUDE_TOOLBAR_FOLDER`; `npx vsce ls --no-dependencies` 26 files.
  After A4: the same counts; VS Code's own when-clause parser (`temp\chat-view\A4-check\check-when-clauses.mts`, a
  one-off script on `monaco-editor` 0.57.0 in temp) prints `PASSED: parsed 9 of 9; 60 evaluations, 0 differences`.
- B: `claude plugin validate hide-actions`; `claude plugin test hide-actions`; the type-check with the header
  tsconfig kept in `temp\chat-view\`.
  After B1 (2026-10-23): validate passed (only the plugin-directory notes `LICENSE_MISSING`, `ICON_MISSING`);
  `claude plugin test` 9 files, 39 tests; type-check 0 errors (23 files of the mod); chat verdict
  (`node temp\chat-view\b1\chat-verdict.mjs`) 5 trees, 0 differences.
  After B2 (2026-10-23): validate passed for the mod and for the repo root (the marketplace); `claude plugin test`
  13 files, 45 tests; type-check 0 errors (28 files of the mod); chat verdict 5 trees, 0 differences; mutants
  (`temp\chat-view\b2\run-mutants.ps1`, about 4 minutes) 39 of 39 caught.
- C: `dotnet build`; `dotnet test`; the real-Claude tests (a separate test category, run only on purpose).
  After C1 (2026-10-23): nothing to build yet; the fixture checker (`temp\chat-view\C1-tools\Check-Fixtures.ps1`,
  no arguments) prints 0, 0, 0, 0 for its four checks.

## 11. What is built so far

| Run | What it built | Checked by, when |
| --- | --- | --- |
| A1 (2026-10-23 15:53-16:29, 87 tool calls) | `claude-toolbar\`: the button model (contracts; the chat-view button as one ordered table giving the derivation, the looks and the cycle; the owned setting `claudeToolbar.hideActions`; Claude's 4 ids in `src\host\claude-extension.ts`; the when-clause helper), the manifest builder and `npm run manifest` (`package.json` `contributes`: 3 commands, `view/title` and `editor/title` entries at `navigation@1`, `commandPalette` hiding, the configuration), both tsconfigs and vitest configs, the integration test. Its contract: "The contract" in `temp\chat-view\A1_REPORT.md`. The reusable mutation runner: `temp\chat-view\mutants\run-mutants.ps1`. | Task-A lead 1, 16:37: typecheck 0 errors; 13 files, 82 tests; integration 4 of 4; mutants 17 of 17 (results file); nothing outside the worker's files changed (`temp\chat-view\lead-a\A1-compare.txt`). |
| A2 (2026-10-23 16:45-17:37, about 102 tool calls) | `claude-toolbar\`: the host (ToolbarHost, `VscodeHost`, the fake `vscode` typed with the real types), the run-command action, the registration (a failed click shows `Clicking "<tooltip>" failed: <message>` once), `extension.ts` (`onStartupFinished`), the bridge file (`bridge-path.ts`, content `{"hideActions":false}` plus LF, written atomically by `utils\atomic-write.ts` with a retry whose count and delay are the owned settings `claudeToolbar.chatViewFileWriteAttempts` 10 and `claudeToolbar.chatViewFileRetryDelay` 50, read at each write; writes queued one at a time); the vitest configs renamed `.mts`. Contract: "The contract" in `temp\chat-view\A2_REPORT.md`. **Found: a reader's open handle blocks the writer's rename even with `FileShare.ReadWrite \| FileShare.Delete` (EPERM); 8.2's "never blocks" is wrong on this machine.** | Task-A lead 1, 17:40: typecheck 0 errors; 25 files, 154 tests; integration 4 of 4; real lock: landed after 4 retries, gave up cleanly on a long one; real reader: 215,615 reads, 0 torn, 0 failed writes (163 retries in 200 writes); mutants 21 of 21; nothing outside the worker's files changed (`temp\chat-view\lead-a\A2-compare.txt`). |
| A3 (2026-10-23 18:14-18:48, 74 tool calls) | `claude-toolbar\`: `npm run package` (`scripts\clean-dist.ts` empties `dist\`, then the build, then `vsce package --no-dependencies --skip-license --allow-missing-repository --out claude-toolbar.vsix`); what goes in is set by `.vscodeignore` (`**`, `!dist/**`; vsce adds `package.json` and `README.md`, packed as `readme.md`); two integration checks that take another folder through `CLAUDE_TOOLBAR_FOLDER`: the package check (`tests\package.integration.test.ts`, 0 extra, 0 missing) and the compiled-extension check (`tests\compiled-extension.integration.test.ts`: `dist\extension.js` loaded with the fake `vscode` through `module.registerHooks`, temp home; 3 commands, 4 subscriptions, bridge 22 bytes; refuses a missing or older `dist\`); `README.md` (the views, the looks, the settings, the bridge file and its reader rule, how to add a button); the bridge error names the file once (`causeText`); the two retry settings declared `integer` (`OwnedSetting.wholeNumber`). Three tests that pinned one button now count from `package.json`. Contract: "The contract" in `temp\chat-view\A3_REPORT.md`. | Task-A lead 2, 18:50: typecheck 0 errors; 26 files, 163 tests; package exit 0, 28 entries; `vsce ls` 26 files; integration 3 files, 12 tests on `claude-toolbar\` and on the unpacked `.vsix`; refuses a folder without `dist\`; manifest unchanged by a rebuild (same SHA-256); README followed literally (second button at `navigation@2`, 164 tests passed); mutants 12 of 12 (results file); nothing outside the worker's files changed (`temp\chat-view\lead-a\A3-compare.txt`). |
| A4 (2026-10-23 19:02-19:27, about 94 tool calls) | VS Code's own when-clause parser on our menus: `monaco-editor` 0.57.0 (built from VS Code commit `6a598d4a`, an ancestor of 1.141.0; the 9 parser source files have the same git blobs at both) packed into `temp\chat-view\A4-monaco\`, only the parser's 9 modules extracted; the one-off check `temp\chat-view\A4-check\check-when-clauses.mts` (arguments: project folder, monaco folder; exit 0 passed, 1 a parse failure or difference, 2 could not run) compares VS Code's reading of `package.json` with our tests' in the 20 contexts, now shared through `claude-toolbar\tests\helpers\menu-contexts.ts`. Contract: "The contract" in `temp\chat-view\A4_REPORT.md`. **Found: VS Code 1.141 shows a menu item whose when-clause it cannot parse in every context of its menu** (`workbench.desktop.main.js`: `a.when=T.deserialize(r.when)`, and `e ? e.evaluate(t) : true`). | Task-A lead 2, 19:31: the check re-run, `PASSED: parsed 9 of 9; 60 evaluations, 0 differences; Command Palette 60 evaluations, 0 shown`; mutants 7 of 7 by the check, 6 of 7 by `npm test` (results file); typecheck 0 errors; 26 files, 163 tests; integration 3 files, 12 tests; in the repo only the two test files and A4's temp files changed (`temp\chat-view\lead-a\A4-compare.txt`; outside the repo the changes are the main session's live install at 19:01:55 and the user's clicks at 19:13). |
| B1 (2026-10-23 17:43-18:13, about 110 tool calls) | `hide-actions\` (new), the Claude Code mod: `.claude-plugin\plugin.json` (0.1.0; options `pollMs` 500, at least 100; `surfaces` "vscode"; `alwaysShow` "AskUserQuestion,ExitPlanMode"; both lists comma-separated text, all three shown in `/config`); `hooks\` (`register.tsx`; `row-visibility.ts`: ToolUse, ToolResult and ToolGroup drawn as the plain empty Box `{ type: 'Box', props: {}, children: [] }` while `hideActions`, else `next(e)`, expanded and always-shown rows never read the value; `bridge-path.ts`, `bridge-reading.ts`, `bridge-poll.ts`: read at `session.start`, polled every `pollMs`, `ENOENT` in the read error = missing = false, any other refusal or invalid JSON keeps the value, valid JSON is true only for `hideActions === true`; `hide-state.ts` holds every `$.state` access); `utils\`; `types\index.d.ts` (`hide-actions.hideActions`); tests named after rules R1-R17 (`tests\hooks\`, `tests\utils\`, `tests\support\`, `tests\fixtures\trees.ts`). The type-check config `temp\chat-view\b-typecheck\tsconfig.json`; the chat-verdict check `temp\chat-view\b1\chat-verdict.mjs`. Its contract: "The contract" in `temp\chat-view\B1_REPORT.md`. | Task-B lead 1, 19:03: validate passed (only the plugin-directory notes); `claude plugin test` 39 pass, 0 fail, 9 files; type-check 0 errors; chat verdict 5 trees, 0 differences; nothing outside the worker's files changed (`temp\chat-view\lead-b\B1-compare.txt`). |
| B2 (2026-10-23 19:05-19:35) | The repo-root `.claude-plugin\marketplace.json` (marketplace `claude-code-extensions`, owner JanekKosa, a top-level description, one plugin `hide-actions` from `./hide-actions`; install id `hide-actions@claude-code-extensions`); `hide-actions\tests\`: `fixtures\toolbar-bytes.ts` (the exact texts task A's real writer wrote into a temp home: `{"hideActions":false}` and `{"hideActions":true}`, each with one LF, no BOM; generated by `temp\chat-view\b2\toolbar-bytes.ts`), `hooks\toolbar-bytes.test.ts`, and one test each for B1's decisions 3, 6 and 8 (`settings-bounds`, `bridge-path-home`, `row-visibility-reads`). Mutation runner `temp\chat-view\b2\run-mutants.ps1` with 40 mutants in `b2\mutants.json`; results `temp\chat-view\B2_MUTANTS.json`. No product code changed. Its contract: "The contract" in `temp\chat-view\B2_REPORT.md`. | Task-B lead 1, 19:39: validate passed (mod: only the plugin-directory notes; root: only advice to add an install line to the README); `claude plugin test` 45 pass, 0 fail, 13 files; type-check 0 errors; chat verdict 5 trees, 0 differences; mutants run-2 39 of 39 caught, the mod unchanged (run-1 35 of 39: three missing tests added, one equivalent mutant replaced); only the worker's files added (`temp\chat-view\lead-b\B2-compare.txt`). |
| C1 (2026-10-23 19:02-19:36, 128 tool calls) | No product code. The launch contract, read from the installed extension (7.2 and 8.5 updated); 10 real starts of the bundled 2.1.306; the fixtures in `chat-filter\tests\ChatFilter.Tests\Fixtures\Claude-2.1.306\`: S1 thinking and text, S2 thinking around a Read call, S3 a two-turn chat with the extension's own arguments (with its stdin and argument files), S5 two subagents; no S4, because no `redacted_thinking` came back. `census.json` gives per fixture the line kinds, API messages, thinking blocks and each message's block sequence. `chat-filter\.gitattributes` holds `*.jsonl -text`. Its contract: section 3 of `temp\chat-view\C1_REPORT.md`; the throwaway runner and fixture tools are in `temp\chat-view\C1-tools\`. | Task-C lead 1, 19:46: the fixture checker re-run prints 0, 0, 0, 0; 4 launch snippets found once each in extension.js; the webview draws the thinking token count only inside a thinking row; nothing outside the worker's files changed except Claude's own writes during the starts (transcripts, plugin sync) (`temp\chat-view\lead-c\C1-compare.txt`). |
