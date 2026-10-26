# Chat view — task B (the mod `hide-actions`): summary

Task B is done (2026-10-23 19:40). It took two worker runs: B1 built the mod and B2 hardened it. No third run was
needed. Written by B lead 1 for the main session. The lead file, with every fact and decision, is
`misc\implementation\chat-view\CHAT_VIEW_MOD_LEAD_CLAUDE.md`. Nothing is installed and nothing is committed.

## What is different now

- **View 2 now has what it needs.** The repo holds a Claude Code mod, `hide-actions\`. Once it is installed, Claude's
  tool-call rows disappear from the VS Code chat while the toolbar's button is on "thinking". The prompts, Claude's
  text and the "Thought for Ns" lines stay. Example: Claude reads 3 files, runs `npm test` and answers. View 2 shows
  "Thought for 4s", "Thought for 2s" and the answer, with no "Read 3 files" row and no `npm test` row.
- **The switch is live.** The mod re-reads the toolbar's file every half second, and rows already on screen go or
  come back without a new chat. Example: one click to "thinking" and the current chat's rows vanish within half a
  second. One more click, to "answers", and they come back, folded by Claude's Focus view.
- **Some things always stay visible.** Question cards and plans stay (AskUserQuestion, ExitPlanMode), and so does any
  row opened in full (ctrl+o). Permission questions are never hidden either, because the chat draws them apart from
  the rows. Example: in view 2 Claude asks to run `git push`, and the "Allow this command?" card shows as usual.
- **Only VS Code is affected by default.** The terminal and the desktop app are untouched.
- **Three options in Claude Code's `/config`:** "Bridge poll interval (ms)" (500, at least 100), "Hide actions on"
  (`vscode`) and "Always show these tools" (`AskUserQuestion,ExitPlanMode`). Example: add `,TodoWrite` to keep the
  to-do list in view 2.
- **The repo is now a plugin marketplace** (a catalogue Claude Code can install plugins from):
  `.claude-plugin\marketplace.json` at the root lists the mod. Its install id is `hide-actions@claude-code-extensions`.

## What was checked, and how

- **Claude's own checks**, using the claude.exe 2.1.306 that ships with the VS Code extension:
  - `claude plugin validate` passed for the mod and for the repo root.
  - `claude plugin test` passed 45 of 45 tests in 13 files.
  - The type-check found 0 errors (TypeScript 7.0.2, against the mod API's types of 2.1.306).
- **The real chat's verdict.** A check script cuts the chat's own "is this row visible" code (`qW`, `GW` and the
  chat's tree cleanup) out of the installed `webview\index.js` 2.1.306 at run time, read-only. It runs that code on
  every drawing the mod returns: 5 drawings, 0 differences. The hidden row is dropped and the engine's own row is
  drawn. Three control drawings come out visible, which shows the check can fail.
- **Break one rule at a time.** The worker made 39 copies of the mod, each with exactly one rule broken, and the tests
  caught all 39. The first round caught 35. Three gaps were missing tests, now added; the fourth broken copy changed
  nothing, so it was replaced by one that does.
- **The toolbar's real bytes.** Task A's own bridge writer was run against a temp folder. It wrote
  `{"hideActions":true}` plus one line feed: 21 bytes, no BOM (an invisible marker some editors put at the start of a
  file). The mod reads all 3 of the toolbar's texts as the toolbar meant them: 0 differences. One broken copy compared
  the text exactly and tripped on the line feed. Only these tests caught it.
- **My own re-runs.** After each run I re-ran validate, test, type-check and the verdict myself, and got the workers'
  numbers. A list of file hashes before and after each run shows only the workers' own new files. B2 changed no
  product file, and nothing outside the repo was touched by B's workers. One look-alike: the real bridge file was
  rewritten at 19:13:38 with unchanged content. B2's generator writes only into its temp home, so that was the
  installed toolbar.

**Not checked, and why:**

- **The live chat**: installing is the main session's job. So far, rows vanishing on screen is shown only by running
  the chat's own code on the mod's drawings. The steps below include a live check.
- **The real "file missing" error.** The engine hands a mod no error code, so the mod takes a read error whose text
  names `ENOENT` as "file missing". In the tests that text is a stand-in. If the real text lacked the word, deleting
  the file in view 2 would leave rows hidden until the file returned. Live step 6 checks it.
- **A read that meets the toolbar's rename**: covered only by a stand-in "file busy" answer.
- **How `/config` draws the three rows**: only the manifest was validated.
- **Speed on a long chat.** With the mod installed, the chat asks Claude's engine about every tool row, in every
  view, one round trip per row. On a long chat rows may appear a moment later. Only a live check shows it.

## Decisions the user might overrule

1. **View 2 hides every tool row except question cards and plans.** That includes failed calls, the to-do list,
   subagent rows and MCP tool rows. The user has seen this; no answer yet.
   Example: `npm test` fails. View 2 shows the thinking and "the tests fail because...", not the red error row.
2. **The two lists are comma-separated text, so all three options show in `/config`.** The user has seen this.
   Example: type `,TodoWrite` after "AskUserQuestion,ExitPlanMode"; a list option could only be edited in settings.json.
3. **The poll interval is at least 100 ms.** The user has seen this.
   Example: `/config` refuses 20; the mod never reads the file 50 times a second.
4. **"File missing" means a read error naming `ENOENT`.** The user has seen this.
   Example: the toolbar never deletes the file, so this matters only if someone deletes it by hand.
5. **A bridge file of valid JSON whose `hideActions` is not `true` reads as "show".** Broken JSON keeps the last
   value. Example: `{"hideActions":"yes"}` shows the actions; a half-written file changes nothing.
6. **The marketplace's description reads "Claude Code mods that work with the Claude toolbar for VS Code."**
   Example: `/plugin` shows it beside the name `claude-code-extensions`.

## Open questions for the user (none blocks anything)

1. **Which license?** Validate's check for Anthropic's plugin directory flags `LICENSE_MISSING` (and a missing icon).
   It matters only for submitting there; installing from the folder or from GitHub works without one. Example: one
   MIT `LICENSE` at the repo root covers all three components.
2. **Should the mod's dev checks get a committed home?** Four helpers live in `temp\`, which is never committed and may
   be wiped:
   - the type-check config;
   - the 2.1.306 API types it reads;
   - the chat-verdict script;
   - the generator of the toolbar-bytes fixture.

   Without them nobody can re-check the mod after Claude's extension updates. My recommendation: a committed folder
   outside the mod (the mod folder is what users install), such as `dev\hide-actions\`. Example: when Claude 2.1.320
   arrives, `node dev\hide-actions\chat-verdict.mjs` says whether the chat still drops an empty row. This is the main
   session's call, or the user's.

## Steps for the main session: install and check live

With `$claude = 'C:\Users\user\.vscode\extensions\anthropic.claude-code-2.1.306-win32-x64\resources\native-binary\claude.exe'`
(the 2.1.306 exe; `~\.local\bin\claude.exe` is the older 2.1.286):

1. `& $claude plugin marketplace add 'C:\Repos\My projects\claude-code-extensions'`. The marketplace is a folder, so
   the mod is read from the repo itself, and later edits reach a chat after `/reload-plugins`.
2. `& $claude plugin install hide-actions@claude-code-extensions`, at the user scope.
3. `& $claude plugin list` should show it, with "Read from:" naming the repo folder. A chat that is already open loads
   it after `/reload-plugins` in that chat; a new chat loads it by itself.
4. Live check in one VS Code Claude chat. Ask for something that reads two files and runs one command, then:
   - click the button to "thinking": the tool rows vanish within half a second, and the thinking lines and the answer
     stay;
   - click to "answers": the rows return, folded by Focus view;
   - click to "everything": all rows are back.
5. In view 2, ask for something that needs permission: the "Allow this command?" card must show.
6. In view 2, delete `%USERPROFILE%\.claude\claude-code-extensions\chat-view.json`. The rows should return within half
   a second. Then click the button once, so the toolbar writes the file again.
7. If rows do not hide:
   - `/plugin` should show `hide-actions` switched on;
   - the bridge file should say `{"hideActions":true}`;
   - a `claude --debug` log names any hook the engine refused.
8. Files task B may not edit:
   - the root `README.md` needs the mod's section, from `temp\chat-view\B1_REPORT.md` section 5, plus one line: "the
     repo root holds the marketplace". That also clears the advice line from validate;
   - optional `.gitignore` line, as a precaution: `hide-actions/.claude-plugin/types/`.

## What the next task must know

- **Task C (the filter)** should read the bridge as the mod does:
  - open, read and close at once;
  - missing → false;
  - unreadable or broken JSON → keep the last value;
  - valid JSON → true only for `hideThinking === true`.

  The toolbar writes compact JSON plus one line feed, with no BOM. The mod reads only `hideActions`, so adding
  `hideThinking` (brief 8.6) needs no change to the mod.
- **Task A (the toolbar):** the mod's path constant, `hide-actions\hooks\bridge-path.ts`, names
  `claude-toolbar\src\bridge\bridge-path.ts` in its comment. Change both together.
- **The fixture is a snapshot.** `hide-actions\tests\fixtures\toolbar-bytes.ts` holds the toolbar's bytes as of
  2026-10-23. If the toolbar's output changes (8.6), regenerate it with `temp\chat-view\b2\toolbar-bytes.ts` while that
  exists (see open question 2).
- **Engine facts for any later mod work:**
  - a `$.state` reference must be a const in the file that calls `$.state`, so every access sits in
    `hooks\hide-state.ts`;
  - JSX `<Box />` comes back with no props and no children, so the hidden row is written as a plain object;
  - `$.state.get` while drawing subscribes a row just as `read` does;
  - the test kit's state versions carry over between tests in one file.

## Files changed (from the hash lists)

- **B1, 25 new files.**
  - `hide-actions\.claude-plugin\plugin.json`
  - `hooks\`: `hooks.json`, `register.tsx`, `settings.ts`, `row-visibility.ts`, `hide-state.ts`, `bridge-path.ts`,
    `bridge-reading.ts`, `bridge-poll.ts`
  - `types\index.d.ts`
  - `utils\`: `errors.ts`, `json.ts`, `paths.ts`, `text-list.ts`
  - `tests\fixtures\trees.ts`, `tests\support\bridge-session.ts`
  - `tests\hooks\`: `bridge-path`, `bridge-poll`, `bridge-reading`, `row-visibility`, `settings` (`.test.ts`)
  - `tests\utils\`: `errors`, `json`, `paths`, `text-list` (`.test.ts`)
- **B2, 6 new files.**
  - `.claude-plugin\marketplace.json` (repo root)
  - `hide-actions\tests\fixtures\toolbar-bytes.ts`
  - `hide-actions\tests\hooks\`: `toolbar-bytes`, `settings-bounds`, `bridge-path-home`, `row-visibility-reads`
    (`.test.ts`)
- No other repo file was changed by B's workers. Their scratch and logs are under `temp\chat-view\` (B1, B2, b1, b2,
  b-typecheck, lead-b), which is never committed.

## Runs: tokens and minutes

| Agent | When | Minutes | Tool calls | Tokens |
| --- | --- | --- | --- | --- |
| B lead 1 | 17:26-19:41, in turns | 16 (first turn) | 70 (first turn) | 257k after the first turn, 321k after answering B1's question; final in the sizes file |
| B1 worker | 17:43-18:13 | 31 | 174 | 362k |
| B2 worker | 19:05-19:35 | 30 | see the sizes file | see the sizes file |
