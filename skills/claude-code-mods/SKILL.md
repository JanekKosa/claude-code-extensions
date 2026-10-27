---
name: claude-code-mods
description: What this machine has learned about writing Claude Code mods (plugins of function hooks) - where the user's mods live and how they are installed, what Claude's VS Code extension lets a mod change and what it does not, which hooks really see subagents and workflow agents, the test kit's stand-in traps, and how to check a mod against the real engine in a headless session. Use together with the bundled plugin-authoring skill whenever building, testing or debugging a mod in claude-code-extensions.
---

# Claude Code mods on this machine

The bundled `plugin-authoring` skill is the API reference. This file holds what was found by experiment, symptom
first.

## Where mods live and how they load

- Every mod is a folder of `C:\Repos\My projects\claude-code-extensions` (one per mod, beside the VS Code extensions).
  Its root `.claude-plugin\marketplace.json` lists them.
- That marketplace is added from the folder, so an installed mod is read from the repo folder itself:
  `claude plugin install <mod>@claude-code-extensions --scope user`, then `/reload-plugins` (or a new chat) after
  each edit. `claude plugin list` shows `Read from:` the repo folder.
- Symptom: a mod change works in tests and in a headless run, but the person's chat still shows the old behaviour
  (seen 2026-10-26: decisions-pane follow-ups missing). Each chat keeps the code of its own last reload. Find it in
  that chat's transcript (`~/.claude/projects/<repo>/<session>.jsonl`): the last `<plugin> re-read from its folder`
  line, timestamp in UTC. Older than the edit means `/reload-plugins` in that chat, not a code fix.
- The `claude.exe` to use is the one Claude's VS Code extension ships:
  `%USERPROFILE%\.vscode\extensions\anthropic.claude-code-<version>-win32-x64\resources\native-binary\claude.exe`.
- "N userConfig options not yet set" after an install is harmless: the manifest defaults apply.

## What a mod can and cannot change in the VS Code chat

- **Claude's agent view under the prompt (the "agent map") cannot be extended.** It lives in the extension's
  minified `webview\index.js`, which changes with every update, and there is no render component for it. A workflow
  shows there as one `local_workflow` task. Checked on 2.1.310. Show agents in a `Pane` instead (`agents-pane`).
- A headless run reports an opened `Pane` as a `system/ui_panes` message, and a command's `$.ui.open` there answers
  `isPlaced: false` with `no-surface`: nothing draws without a surface, so check the look in a VS Code chat.
- VS Code draws a `Button` as a boxed, blue button even with `plain` set (seen by the user on 2.1.310); with
  `dimColor` it is transparent but keeps a thin outline and side padding (its CSS in `webview\index.css`). A Button
  takes only strings and `Text` as children, so no `Svg` inside one. There is no pressable `Text` or `Box`.
- A pressable without a box: a `Markdown` with `key`, `onLinkPress` and `pressableLinks: [href]`. The link must be
  `https:` to be drawn as a link (a made-up `https://<mod>.invalid/...` works); a press runs `onLinkPress` and opens
  nothing. In the test kit, `ui.press({ key, link: { href } })`.
- The terminal's element table answers `Svg` at run time but draws an empty `Box` for it: pick the fallback by
  `e.surface`, not by `'Svg' in elements`. An `Svg` without `isInteractive` is drawn as an image; Chromium
  plays SMIL (`<animateTransform>`) in an image, but that is not yet seen in the VS Code chat.
- A pane scrolls by itself in VS Code: all open panes share one inline block with a tab row (`.tabs`), and its body
  (`.paneBody`) has `overflow: auto`, capped at `max-height: 12lh` by the inline CSS (2.1.310). `$.ui.open`'s `rows`
  is passed on (a headless `ui_panes` shows `"rows": 20`); whether the webview lets it past 12 lines is not yet seen.
- No API orders the tabs: `$.ui.panes()` lists a plugin's own panes "in open order", and a plugin cannot reorder
  another's. To sit left of the Agents tab, a pane opens at `session.start`, before any agent starts.
- VS Code and the desktop have `Input` and `Select`; mobile has neither. An `Input` drawn without `value` keeps what
  the person typed across redraws, but not when the field is drawn anew. Symptom: the person's comment vanished
  after Ctrl+Tab or switching pane tabs (user, 2026-10-26). Save each change in `$.state` and draw it back as
  `value`; that redraws on every keystroke, which the webview's field is built to absorb.
- What the VS Code webview really draws (read from `webview\index.js` and `index.css`, 2.1.310):
  - `Text` bold only with `bold`; `weight="semibold"` draws plain. `color` takes the theme names (`error`,
    `warning`, `success`, `inactive`, `claude`, ... mapped to `--app-*` variables, so `warning` is the theme's
    shade, often yellow), the ANSI names, or `#hex` / `rgb()`. Use hex for an exact colour.
  - `Button` sends only `key`, `label`, `dimColor` and the children's bare strings: `variant`, `plain` and Text
    styling inside it are dropped. Its CSS is `white-space: nowrap` with no padding above or below, so a long label
    is cut off and nothing makes it taller. A `Box` with `borderStyle` and `paddingY` holding a pressable
    `Markdown` link (below) pads and wraps, but its text reads as a blue underlined link: the user turned that down
    for a pick list (2026-10-26) and kept buttons. Space around a button or `Input` is all a mod can add.
  - `Box` padding and margins take fractions: down in `lh` (`paddingY={0.35}`), across in `ch`. `borderStyle` is a
    1px border, `round` adds a 6px radius; `borderColor` takes the same colours as `Text`.
  - `Input` is an HTML `<input>`: one line, whatever the API's `rows` says (the webview's schema drops `rows`). A
    long text scrolls sideways inside it, the field never grows, and a newline cannot be typed. A mod cannot change
    this. It draws its own submit button only when `submitLabel` is truthy:
    `submitLabel=""` removes it. `onSubmit` is still required.
  - Symptom: in a row `Box`, the text beside a button drops below it once the pane is narrow. The webview gives a
    row `Box` `flex-wrap: wrap` unless `flexWrap` is set; set `flexWrap="nowrap"` to keep children side by side.
  - A long pick-list option that must wrap: a row `Box` (`flexWrap="nowrap"`, `alignItems="flex-start"`, `columnGap`) holding a `Button`
    with only the mark, then `<Box flexShrink={1} minWidth={0}><Text wrap="wrap">` with the words. Each wrapped line
    starts under the first word; only the mark is pressable (`decisions-pane`, 2026-10-26). `flexShrink` and
    `minWidth` (in `ch`) do reach the webview's CSS.
  - Symptom: a picked radio mark ● sits lower than the empty ○ and looks smaller. In Segoe UI (the chat font on
    Windows) ● is 43% of the font size tall with its middle 7% lower than ○'s (measured with WPF's
    `FormattedText.BuildGeometry`). Use ◉ (U+25C9) for picked: it falls back to a font where it has ○'s exact size
    and middle.
- A mod can write files through another program: `$.process.run([node, script, ...args])` takes an argument vector
  with no shell, so the person's words need no quoting (`decisions-pane` runs the agent team's `register.mjs` so its
  lock and layout hold).

## Which hooks see which agents (checked on 2.1.310 with a live run)

- `agent.spawn` hears every agent: main-chat subagents, subagents spawned inside a subagent (`parentAgentId` set),
  and each workflow `agent()` call. Wrapping the spawn in your own hook does not hide the nested spawns from it.
- A workflow agent has `e.workflow` set, `e.tool_use_id` = the Workflow call's id (the same for all its agents),
  `e.description` = the `label` the script gave, and `subagentType` = `workflow-subagent` unless the script named an
  `agentType`.
- `turn.complete` with `e.agentId` marks each agent's end; `session.append` with door `response` and `e.agentId`
  gives each agent's tool calls (its current step).
- `turn.step` (an async generator: `const r = yield* next(e)`) also hears every agent's model requests, workflow
  and nested ones included: `e.effort` is the request's effort, and `r.usage` (input + cache read + cache creation +
  output tokens) is the agent's context size after it. Stored rows carry no token usage.

## Keeping test agents alive long enough to watch (checked 2026-10-25)

- Symptom: test agents told to `Start-Sleep -Seconds 90` first still finish in 15-40 s. The harness refuses a
  foreground sleep ("Blocked: standalone Start-Sleep 120"), `code-searcher` refuses it as not read-only, and a
  workflow agent may push it to the background, which ends when the agent answers.
- To keep agents running for minutes, give them real reading work (read and summarise many files), not a sleep.

## Test kit traps (`claude plugin test`)

- Symptom `HooksError: no implementation for session.end ... returned no { sessionId }`: a `session.end` stand-in
  must answer `{ sessionId: e.sessionId }`.
- A stand-in for a call on `$` (an op such as `ui.close`, `ui.open`, `ui.panes`) answers `{ value }`; for
  `ui.close` that is `{ value: undefined }`, or tsc refuses the hook.
- The test's `$` raises events, not ops: `$.ui.close` is undefined there, so a person's close cannot be raised.
  Test the same state through the mod's own command instead.
- `$.agent.spawn` on the test's `$` takes the whole `AgentSpawnInput`, so a test can raise workflow and nested
  spawns.
- A `process.run` stand-in answers `{ value: { exitCode, stdout, stderr, isStdoutTruncated, isStderrTruncated } }`;
  without the two flags tsc refuses it with "Property 'deny' is missing". An `fs.stat` or `fs.read` stand-in answers
  `{ deny: 'ENOENT ...' }` for a missing file, which the mod sees as a rejection.
- Symptom: `ui.findAll({ type: 'Text' })` finds the Text but its `key` is `undefined`, though the mod set one. A
  Text's key is not kept in the drawing (a Button's is). Find a Text by document order instead: `findAll({})` lists
  every element top to bottom, so take the first Text after its Button.
- Symptom (tsc) `Mounted<"vscode", "Pane"> is not assignable to Mounted<RenderSurface, "Pane">`: a helper that reads
  drawings of several surfaces takes a structural type such as `{ findAll(query): Promise<FoundElement[]> }`.
- The test kit resolves and normalises a file path before an fs stand-in sees it, so a file planted at a raw, oddly
  spelled path never matches; to prove a path is never looked at, assert on the list of paths asked, not on a planted
  file.

## What `claude plugin validate` refuses (2.1.310)

- `on("session.start") is registered twice without a matcher`: one module, one unmatched hook per event. Register it
  once in `register.tsx` and call each part's start from it.
- `the state library's read takes a source the scan can read`: `read($, ref)` or `update($, ref, ...)` with `ref`
  from a loop over atoms (`for (const ref of [A, B])`). Name each atom at its own call.

## Checking against the real engine

- A mod's slash command is not run from `claude -p "/cmd"` (the text goes to the model). Send it as a stream-json
  user message: `claude -p --input-format stream-json --output-format stream-json --verbose`, one JSON line per
  message. Its answer comes back as `<local-command-stdout>`.
- To see a mod's state after a real run, copy the mod to the scratchpad, make its command answer
  `JSON.stringify(state)`, and run the copy with `--plugin-dir <copy> --setting-sources project` from the
  scratchpad (no user hooks), the scenario as the first message and the command as the next ones.
- /clear gives the session a new id (seen in the next init and result, and in SessionStart with source "clear");
  conversation_reset.new_conversation_id is not that id. Headless -p --resume <id> keeps the id (2.1.310).
- UserPromptSubmit does not fire for a slash command sent headless; only SessionStart does.
- A scratch TEMP set on the claude.exe process reaches a mod's $.env.get, so a mod that reads files under %TEMP% can
  be checked without touching the real one.
