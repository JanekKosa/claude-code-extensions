# Chat view — task C lead (the filter)

The task-C lead's plan and notes. A successor lead reads this file first; it holds everything needed to carry on.

## The task

- **Component**: `chat-filter\` (C), a Windows program in C# (.NET 10). VS Code starts it instead of Claude; it starts
  the real Claude and passes everything through, except that it keeps Claude's thinking out of what reaches the
  chat while the bridge file says `hideThinking`. Claude itself still thinks and keeps its thinking.
- **The user's words**: "i dont want to turn off thinking, i just dont want it to show in the user output"; "build
  the filter too and test it hard, when it's done add it to the toggle".
- **Scope** (from the main session, 2026-10-23 17:26): worker brief 8.5 and its test levels 1 to 4, ending with a
  published build inside the repo and the exact install steps in the task summary. Level 5 (inside the user's VS
  Code) and installing are the main session's, with the user. 8.6 (the toolbar's switch to the filter) is a later
  step outside this task.
- **Allowed without asking**: real runs of the bundled 2.1.306 `claude.exe`, at most 15 starts per worker run, short
  prompts. Anything else live or outside the repo: `QUESTION FOR MAIN`.
- **Baseline** (main session, 17:25): nothing of task C exists; tasks A and B are under way; the repo has no
  commits. Workers run one at a time across all tasks (A and B first), started by the main session.
- **Binding documents**: `CHAT_VIEW_LEAD_BRIEF_CLAUDE.md` (whole); from `CHAT_VIEW_WORKER_BRIEF_CLAUDE.md` sections
  1 to 6, 7.2, 7.3, 7.5, 8.1, 8.2, 8.5, 8.6, 9, 10, 11; `CHAT_VIEW_SIZES_CLAUDE.md` at each wake-up.

## Layout of `chat-filter\` (decided by this lead, 2026-10-23)

```
chat-filter\
├─ ChatFilter.slnx (or .sln)          the solution (C2)
├─ .gitattributes                     *.jsonl never converted to CRLF: fixture tests compare bytes (C1)
├─ src\ChatFilter\                    the program; assembly and exe name chat-filter (C2, C3)
├─ tests\ChatFilter.Tests\            xUnit: unit (level 1), process (level 2), real Claude (level 3, own category)
│  └─ Fixtures\Claude-2.1.306\        sanitized real captures + census.json (C1)
├─ tests\FakeChild\                   the stand-in child program for the process tests (C3)
└─ tests\Mutation\                    the mutant list and its runner, re-runnable on the final code (C2 onward)
```

Why one test project: the levels share the fixtures and the stream checks; level 3 is kept out of ordinary runs by
its category. Why fixtures per Claude version: a new Claude version is captured beside the old one, not over it.
The root `.gitignore` already ignores `bin/`, `obj/`, `publish/`, `TestResults/` and `/temp/`: the published build
is not committed.

## The runs

Workers reach 400 thousand after about 100 tool calls; a run holds two real points and a check against real
material, and every run breaks its own rules one at a time in a copy (N of N).

| Run | Two points | The check against real material | Why here |
| --- | --- | --- | --- |
| C1 capture | 1. The launch contract, read from the installed extension (read-only): the wrapper's argv, env, cwd; which starts go through it; how a chat is stopped; where a reopened chat's history comes from. 2. Real 2.1.306 captures (5 scenarios), sanitized into fixtures with a census. | Fixtures equal the raw captures except at the sanitized spans (0 differences); 0 forbidden strings; census 0 mismatches; sanitizer mutants N of N. | 8.5: the shapes are captured before the filter is written; the argv shape decides the program's start. |
| C2 line filter | 1. The solution, and the byte-level line framing (CRLF, no final newline, huge lines, chunk edges inside UTF-8). 2. The thinking remover: one decision per API message (keyed by message id, shared by its stream events and its `assistant` lines), renumbering, fail open. | Every fixture through the filter: view off byte-identical; view on no thinking, indexes contiguous, everything else unchanged; the 8.5 level-1 cases; mutants N of N. | The riskiest logic, testable without processes. |
| C3 the program | 1. The process host: start with the same argv, cwd and env, no console window, job object kill-on-close before the child can start children, the three pumps, exit code, stdin close; filtering only for chat runs. 2. The bridge reader (poll: open, read and close at once, never held open; missing/invalid rules; only a JSON `true` hides: see "Rules from the main session"), configuration, the error log with its cap. | The fake child replays the C1 captures through the built exe: view off byte-identical, view on as C2's oracle; flooding without deadlock; killing the filter kills child and grandchild; mutants N of N. | Processes and files are another kind of risk and need the fake child. |
| C4 real Claude, publish | 1. The real-Claude test category (level 3, at most 15 starts). 2. Publish to `chat-filter\publish\<version>\`, run the published exe from a temp copy, write the install and rollback steps. | Level 3 as 8.5 lists it; the whole mutant list re-run on the final code (level 4), N of N; the published exe's hash equals the tested one. | Last, on finished code. |
| C5 (only if C4 does not fit) | The level-4 pass and the publish move here. | as above | The mutation check is never dropped. |

## Decisions (with reasons; each reported to the main session under DECISIONS SINCE LAST TIME)

- 2026-10-23, the layout above.
- 2026-10-23, fixtures are real captures committed in the repo, sanitized: the user's folders and machine name
  become placeholders (`<home>`, `<repo>`, `<cwd>`, `<host>`), and any line listing the user's set-up or account
  (the `system` `init` line: MCP servers, skills, plugins) is replaced by a minimal line of the same type. Nothing
  else changes. Reason: tests must run from a clean clone, and the repo may become public.
- 2026-10-23, every real Claude run of task C uses one working folder, `temp\chat-view\claude-runs\` in the repo:
  Claude records it as one project in `~\.claude.json` and keeps the transcripts under
  `~\.claude\projects\<that folder's key>\`. Nothing deletes them (that would be a write outside the repo). Reason:
  the side effects of the allowed runs stay in one place that belongs to none of the user's workspaces.
- 2026-10-23, no run allows the Bash, Edit or Write tools to the real Claude, so the user's edit and shell hooks
  never fire during tests.
- 2026-10-23 19:50, after C1 (answers to C1's questions):
  - S2's fixture keeps Claude's Read path cut into `input_json_delta` pieces, and S5 keeps the working folder
    written as Claude's project key: both hold only the repo's own folder path, no user name. Dropping S2 would
    lose the only real tool-call fixture.
  - **The filter removes thinking blocks only** (8.5). `system/thinking_tokens` lines, token counts,
    `thinking_display` and `thinking_duration_ms` pass unchanged. Evidence (lead, 19:45): `webview\index.js`
    feeds the live token count (`thinkingTokenEstimate`, from `system/thinking_tokens` and `estimated_tokens`) only
    into the thinking row `m10` ("Thinking... · 248 tokens"); `thinking_duration_ms` and `thinking_display` occur 0
    times in the webview. With the block gone, nothing of them shows.
  - The two captures C1 offered (progress-update thinking with text before tool calls; `--thinking-display=
    summarized`) move to C4's real runs; C2's fixture tests read every fixture file, so a new capture adds coverage
    without code. `--forward-subagent-text` is not captured: the chat does not pass it.
  - C1's changed prompts stand: Opus 5.5 skips thinking on easy prompts, so real-run tests use prompts that force
    reasoning (the 9.11 vs 9.9 trap thought twice in two runs).
  - One decision per API message, keyed by message id and shared by its stream events and its `assistant` lines;
    the switch is read once, at the message's first sight.
  - The mutant list and its runner are committed in `chat-filter\tests\Mutation\`, so C4 re-runs every mutant on
    the final code.
  - NuGet packages restore to the machine's usual cache (`%USERPROFILE%\.nuget\packages`); reported to the main
    session, which can stop it before C2 starts.

## Findings that limit the filter (sent to the main session for the user, 19:50)

- A reopened chat's earlier turns come from the transcript file, read by the extension itself (`readSessionForHost`):
  the filter never sees them, so their thinking rows show again. New replies in that chat are filtered.
- Opus 5.5 thinking has no text in the chat's default display (`"thinking_display":"updates"`): today's thinking rows
  are "Thought for Ns" lines without text, plus progress notes of 1-2 sentences before tool calls (documented, not
  yet captured). Those are what the filter hides.
- Setting `claudeCode.claudeProcessWrapper` changes Claude's extension itself: programmatic sessions join the
  sessions list; telemetry and the update check are off; a chat without an explicit permission mode gets `default`;
  the process id is no longer recorded at spawn. Level 5 (main session) checks these.
- When the extension finds no bundled `claude.exe`, it starts the wrapper without the path argument: the filter must
  then fail with a clear message on stderr (C3).

## Rules from the main session

- **Reading the bridge file, the same as the mod** (main session, 2026-10-23 17:42; task B's lead settled it for the
  mod). Only a JSON `true` hides thinking. A file that is valid JSON but whose `hideThinking` is anything other than
  exactly `true` (missing, `false`, `"yes"`, `1`, `null`) reads as false. A file that cannot be read, or is not
  valid JSON, keeps the last value read. A missing file means every field false (worker brief 8.2). Example:
  `{"hideThinking":"yes"}` shows thinking. **This goes word for word into C3's task message** (C3 builds the bridge
  reader), with a test for each of those values and a mutant that treats a truthy value other than `true` as true.
- **Holding the bridge file open blocks the writer** (main session, 2026-10-23 17:55; worker brief 8.2 corrected).
  Run A2 measured on this machine that a reader holding `chat-view.json` open blocks the toolbar's rename (EPERM)
  until it closes the file, even when it opened it with `FileShare.ReadWrite | FileShare.Delete`; the brief's old
  line that those flags never block the writer was wrong. So the filter's reader opens, reads and closes the file at
  once on each poll, and never keeps it open between polls. The toolbar's retries absorb short holds (163 retries
  in 200 writes against a reader polling flat out, 0 failed writes). A filter test that polls in a tight loop while
  something writes can starve the writer: tests poll at the real interval. **This also goes into C3's task
  message**, with a test that the file is closed between polls (for example, a rename over it succeeds while the
  reader runs at its real interval) and a mutant that keeps the file open.

## How each run is checked (by this lead)

1. Before the run: `temp\chat-view\lead-c\snapshot.ps1 -Run <run> -Mode before` (a copy of lead A's script that
   also watches `%LOCALAPPDATA%\claude-code-extensions`). After: `-Mode after`, read `<run>-compare.txt`; changes
   by tasks A and B (their folders, their temp files) are theirs.
2. The component's checks (worker brief section 10): `dotnet build`, `dotnet test` (counts), the real-Claude
   category only when the run is about it; output to a file under `temp\chat-view\lead-c\`, tail read.
3. The contract and one or two real results opened.
4. One row each in worker brief section 11 and `CHAT_VIEW_STATUS_CLAUDE.md`; this file's log below.

## Log

| Run | Task file | Started | Ended | Tool calls | Result | Checked |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | `temp\chat-view\C1_TASK.md` (written 17:38) | 19:02 | 19:36 | 128 (390k) | launch contract confirmed; 10 of 15 starts; fixtures S1, S2, S3, S5 + `census.json`; no S4 (no redacted_thinking came back); checker 0/0/0/0; sanitizer mutants 11 of 11 (2 equivalent). Report `temp\chat-view\C1_REPORT.md` | lead, 19:46: checker re-run 0/0/0/0 (`lead-c\C1-check-fixtures.txt`); 4 snippets once each in extension.js; fixture counts recounted independently; compare (`lead-c\C1-compare.txt`): only C1's own files in the repo; outside it only the main session's toolbar install and bridge file, and Claude's own writes during the starts (transcripts, `~\.claude\plugins\synced\` at 19:13 and 19:19). Brief 7.2, 8.5, 10, 11 and the status file updated |
| C2 | `temp\chat-view\C2_TASK.md` (written 19:49) | | | | | before-snapshot at 19:49 (`lead-c\C2-before.json`; the snapshot script now records a file another task holds locked as `locked` instead of failing) |

The user has seen the four decisions of 17:38 (cleaned recordings committed as test data, test runs' traces left in
their Claude set-up, one test project, no Bash, Edit or Write in test runs) and had not objected by 17:42.

## Open questions

- For the user: none waiting. The reopened-chat limit went up as a finding (19:50), not as a question: no design
  choice is open, because no mod or setting can hide thinking (worker brief 7.3).
- For C3: the error text when the path argument is missing; how the filter tells the two cases apart (first
  argument an existing file vs a flag).
- For C4: real-run prompts must force reasoning; capture S6 (several rounds of tool calls, progress-update
  thinking with text) and S7 (`--thinking-display=summarized`) as fixtures.
