# Chat view — task B (the mod `hide-actions`): lead file

Kept by the task-B lead; a successor continues from this file alone. Repo: `C:\Repos\My projects\claude-code-extensions`.
The main session's id is `main`; it starts every worker and alone touches anything live.

- **Lead**: B lead 1, started 2026-10-23 17:26. First turn (read in, plan, B1 task) ended 17:42; B1 then waits in
  the worker queue behind task A's A3.
- **Task**: `hide-actions\` as worker brief 8.4 describes it: the Claude Code mod that removes Claude's tool-call rows
  from the VS Code chat while the bridge file says `hideActions`. It makes view 2 work ("one that shows thinking").
  Done when `claude plugin validate`, `claude plugin test` and the type-check are clean, plus the repo-root
  `.claude-plugin\marketplace.json`. Installing it is the main session's.
- **Baseline at the start** (main session, 17:25): nothing of B built; the bridge contract (worker brief 8.2) is fixed:
  the toolbar writes `{"hideActions": <bool>}` to `<home>\.claude\claude-code-extensions\chat-view.json` (its constant:
  `claude-toolbar\src\bridge\bridge-path.ts`). Task A: A1 checked, A2 closing, A3 next in the worker queue. The repo
  has no commits; never commit.

## The runs

Workers run one at a time across all tasks (memory). Each run: two real points and a check against real material.

1. **B1 — build the mod.** Point 1: rows follow the value (ToolUse, ToolResult, ToolGroup on the listed surfaces draw
   an empty Box while `hideActions`, else the engine's own; `isExpanded` and `alwaysShow` drawn as usual). Point 2:
   the value follows the bridge file (read at `session.start`, polled every `pollMs`, missing → false, unreadable or
   invalid → kept, a change redraws). Real material: the installed chat's own `qW`/`GW` over every tree the suite
   asserts, 0 differences. Then validate, test, type-check. Task: `temp\chat-view\B1_TASK.md`.
2. **B2 — harden.** Break one rule at a time in a copy of the mod, one mutant per rule R1-R17 of `B1_TASK.md`, N of N
   caught (the mutation check's own run). The toolbar's real bridge writer (task A's code, run read-only into a temp
   home) writes the files the mod's tests read: 0 differences; any polling of that file runs at the mod's real
   interval, never flat out (8.2 correction below). The repo-root `marketplace.json`, validated. Runs after A3.
3. **B3 — only if needed.** Surviving mutants, answers to open questions, anything B1 or B2 left.

Why cut so: the two build points are tested together (the tests drive the value through the bridge, answering
`fs.read` themselves), so they share a run. The mutation check needs the finished suite and runs `claude plugin
test` once per mutant; with the discovery a new API costs, B1 plus mutants would pass the ~100 tool calls a worker
has, so it gets B2. The cross-check with A's writer needs A2's writer checked, which it will be by B2.

## Facts established while planning (2026-10-23, all read-only)

- **Permission cards are not tool rows.** The chat draws "Allow this command?" in the conversation component from
  `permissionRequests` (`webview\index.js` line 2551: `N=$.permissionRequests.value[0]`), and the API says "The
  permission dialog is drawn by the engine alone" (types line 9807). AskUserQuestion's and ExitPlanMode's buttons are
  in that same card (line 2541: "Submit answers", "No, keep planning"). So hiding rows never hides a pending question.
- **The chat's verdict is two pure functions.** `qW` (holds an engine node) and `GW` (draws something visible) on line
  2515 are self-contained, over the wire tree `{type, props, children}`. `GW` calls `$.children.some(...)` on a Box,
  so a Box sent without a `children` array would throw in the chat. The tool row `aK` ends
  `D&&!x?null:Y(d)` (D: no engine node, x: `GW`).
- `RenderElement` is plain data; the engine's own drawing is `{ type: 'engine', ref }` (types 9821, 10144).
- **The test kit has no fs, network or process** (types header lines 29-44). A test's own `on('fs.read', ...)` stands
  for the disk; `mock.env`, `mock.clock`, `mock.store`, `mock.session` exist (types 16370-16481). Tests never touch
  the real bridge file.
- `$.fs.read` takes an absolute path as given, rejects when missing and with the OS errno otherwise (types 3304-3330);
  no built-in path limit.
- `session.start` fires once per process per plugin and again for a reloaded module; a reload drops the old timers
  (types 4462-4473). Starting the poll there survives `/reload-plugins`.
- `PluginOptions` values are `string | number | boolean | readonly string[]` (types 7860).
- The bundled `claude.exe` 2.1.306 is present:
  `C:\Users\user\.vscode\extensions\anthropic.claude-code-2.1.306-win32-x64\resources\native-binary\claude.exe`.
- TypeScript for the type-check: `claude-toolbar\node_modules\typescript` 7.0.2 (`bin\tsc`), run read-only. Nothing is
  installed for B.
- The real bridge file does not exist (17:30); it stays missing until the main session installs the toolbar.

## Corrections from the main session

- **Worker brief 8.2 corrected** (main's message stamped 17:55; this machine's clock read 17:44 when it arrived).
  Run A2 measured that a reader holding `chat-view.json` open blocks the toolbar's rename (EPERM) until it closes it,
  even when opened with `FileShare.ReadWrite | FileShare.Delete`. So readers open, read and close at once, and never
  keep the file open. The toolbar retries short holds: a reader polling flat out caused 163 retries in 200 writes and
  0 failed writes. For B: `$.fs.read` opens and closes per call, so the mod is fine as designed; it must never hold
  the file or watch it through an open handle. **B2's check against the toolbar's real writer polls at the mod's real
  interval (`pollMs`, 500 ms), never flat out**, or it starves the writer. The B1 worker (`ab53c7027c0f8e8df`) was
  told at 17:45 to state this read discipline in its contract; its build does not change.
- The user has seen decision 1 below; no answer yet. Build as decided.
- Worker queue after B1: task A's A3, then B2.

## Decisions

| # | Decision | Example | Other choice | Who, when |
| --- | --- | --- | --- | --- |
| 1 | In view 2 every tool row hides except AskUserQuestion and ExitPlanMode (8.4's default list): failed and interrupted calls, the to-do list (TodoWrite), subagent rows and MCP tool rows hide too. | `npm test` fails: view 2 shows Claude's thinking and "the tests fail because...", not the red error row. | Keep failed calls, or the to-do list, visible in view 2. | B lead, 17:40 (reading of 8.4) |
| 2 | A bridge file that is valid JSON but whose `hideActions` is not `true` (missing, `false`, another type) reads as false; unreadable or invalid JSON keeps the last value. | `{"hideActions":"yes"}` shows the actions. | Treat a wrong type as invalid and keep the last value. Task C's filter should read `hideThinking` the same way. | B lead, 17:40 |
| 3 | A ToolGroup is drawn as usual when any call in it names an `alwaysShow` tool. | Practically never seen: groups hold reads and searches. | Hide the group regardless. | B lead, 17:40 |
| 4 | On a surface not listed in `surfaces`, the hooks pass on without reading the value, so those rows never redraw for it. | The terminal is never touched. | Read everywhere (harmless redraws). | B lead, 17:40 |
| 5 | The type-check runs the toolbar's installed TypeScript 7.0.2 read-only, its config in `temp\chat-view\b-typecheck\`. | `node claude-toolbar\node_modules\typescript\bin\tsc -p temp\chat-view\b-typecheck\tsconfig.json` | Install TypeScript for the mod (an npm install). | B lead, 17:40 |
| 6 | `surfaces` and `alwaysShow` are comma-separated text options, so all three options are rows in Claude Code's `/config`. The API has a list type (`"multiple": true`, accepted by 2.1.306), but the plugins reference says a list is not a `/config` row (B1 worker found it). | `/config` shows "AskUserQuestion,ExitPlanMode"; the user adds `,TodoWrite` in place to keep the to-do list in view 2. | List options, changed only by editing `pluginConfigs` in settings.json by hand. | B lead, 17:52, on B1's question |

## Questions that can wait (for the summary)

- **License (the user's).** `claude plugin validate` passes, but its separate check for Anthropic's plugin directory
  prints `LICENSE_MISSING` and `ICON_MISSING`. Only matters for submitting to that directory; a local install works.
  Example: a `LICENSE` (say MIT) at the repo root clears it for every component. Not chosen by any agent.
- **A committed home for the dev checks.** The type-check config (`temp\chat-view\b-typecheck\tsconfig.json`), the
  API types it points at (`temp\chat-view\plugin-authoring\types\`, 2.1.306) and the chat-verdict check
  (`temp\chat-view\b1\chat-verdict.mjs`) live in `temp\`, never committed. Recommend keeping them in the repo (a folder
  outside the mod, since a mod folder is shipped); a new folder is the main session's call.
- **Text for files task B may not edit** (from `temp\chat-view\B1_REPORT.md` section 5): a README section for the
  mod; an optional `.gitignore` line `hide-actions/.claude-plugin/types/` (a precaution: the engine lays its types
  there only for a hot-reloaded folder; never seen in B1).
- **Risk for the live check after install**: with the mod installed, the chat asks the engine about every tool row in
  every view (one round trip per row; the row waits for the answer). On a long chat rows may appear a moment later.
  Only a live check shows it.

## Checking a run (the lead does it, every time)

1. The worker's first step runs `temp\chat-view\lead-b\snapshot.ps1 -Run <run> -Mode before`. After the run the lead
   runs `-Mode after` and reads `temp\chat-view\lead-b\<run>-compare.txt`. Expected changes: the worker's own files;
   other leads' notes under `misc\` and `temp\chat-view\` (tasks A and C).
2. The checks, outputs to `temp\chat-view\lead-b\<run>-*.txt`, tails read: `claude plugin validate hide-actions`,
   `claude plugin test hide-actions` (2.1.306 exe), the type-check, the chat verdict. Memory first, one at a time.
3. Open the report's contract and one or two real results.
4. Add a row to worker brief section 11 and to `CHAT_VIEW_STATUS_CLAUDE.md`; read `CHAT_VIEW_SIZES_CLAUDE.md`.

## Run log

| Run | Started | Ended | Tool calls | Result | Checked by the lead |
| --- | --- | --- | --- | --- | --- |
| B2 | 19:05 | 19:35 | see the sizes file | The repo-root marketplace (validates clean, with a top-level description); the toolbar's real bytes (task A's writer in a temp home: `{"hideActions":false}`/`{"hideActions":true}` + LF, no BOM) read as meant, 0 differences; 3 missing tests added (B1's decisions 3, 6, 8); mutants run-2 39 of 39 caught (run-1 35 of 39; R17 was equivalent, replaced by R17b). No product code changed. | Snapshot 19:37: only B2's 130 entries, all added (6 product files); mod code unchanged; nothing outside the repo by B2 (the real bridge file rewritten 19:13:38 with the same hash: the installed toolbar; B2's generator writes only into its temp home). Re-run 19:38: validate root passed (README advice only), mod passed (directory notes only); test 45 pass, 0 fail, 13 files; type-check 0 errors, 28 mod files; verdict 5 trees, 0 differences; `B2_MUTANTS.json` run-2 39 caught of 39, mod unchanged. Rows added to brief sections 10, 11 and the status file. **Task B done**: summary `CHAT_VIEW_MOD_SUMMARY_CLAUDE.md`. |
| B1 | 17:43 | 18:13 | 174 (sizes file) | Built the mod (25 files: 9 code, 11 tests, fixture, support, contract). Its own checks: validate passed; test 39/39 in 9 files; type-check 0 errors; verdict `5 trees, 0 differences` (the chat's own `qW`/`GW`, and its normalizer `Rb0`, cut from the bundle at run time; a negative run shows it can fail). | Snapshot 18:14: only B1's files plus other leads' notes; nothing outside the repo; node_modules and git objects unchanged. Contract read in the code (row-visibility, bridge-reading, bridge-poll, plugin.json): matches the report. Four checks re-run 19:02-19:03 (outputs `temp\chat-view\lead-b\B1-*.txt`): validate passed, exit 0 (only the plugin-directory notes: 1 refusal, LICENSE; 1 warning, icon); test 39 pass, 0 fail, 9 files, 6 s; type-check exit 0, no output, 23 mod files plus the 2.1.306 types; verdict 5 trees, 0 differences. Rows added to worker brief sections 10 and 11 and to the status file. |

B1's decisions worth carrying (its report section 6): the hidden tree is the plain object
`{ type: 'Box', props: {}, children: [] }` (JSX `<Box />` comes back with neither, and `GW` reads both); "missing" is
the word `ENOENT` in the rejection's message (no `code` field reaches a mod; live check: delete the file in view 2,
rows return within half a second); `pollMs` has `min: 100`; the `/config` titles "Bridge poll interval (ms)", "Hide
actions on", "Always show these tools"; an empty `USERPROFILE` counts as unset; no home folder → no read, no poll,
rows show; expanded and always-shown rows never read the value; every `$.state` access in `hooks\hide-state.ts`
(the engine refuses a state reference imported from another file).

B2's task is written: `temp\chat-view\B2_TASK.md` (18:17; amended 19:05 for the two changes below). START WORKER
for B2 sent 19:05.

**Changes from the main session at 19:02.** (1) The user has the tasks run in parallel (C1 and A4 run beside B2): the
rule "no heavy command while a worker runs" is gone; instead, free memory checked before every heavy command, none
started below 1.0 GB (wait a minute, check again), and one heavy command at a time per agent. B2's task says so.
(2) The toolbar 0.1.0 is installed in the user's VS Code since 19:02, so the real bridge file exists and changes when
the user clicks the button. B2 never reads, writes, opens or watches it; its check uses a temp home only. In a
snapshot compare, a CHANGED real bridge file is the user's toolbar, not the worker.

## Files of task B

`hide-actions\**` (B1, B2); `.claude-plugin\marketplace.json` (B2); `temp\chat-view\B*_TASK.md`, `_PROGRESS.md`,
`_REPORT.md`; `temp\chat-view\b1\`, `b2\`, `b-typecheck\`; `temp\chat-view\lead-b\` (the lead's).
