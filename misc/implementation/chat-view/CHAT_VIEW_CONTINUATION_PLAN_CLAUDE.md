# Chat view — continuation plan for the next main session

Written 2026-10-23 15:28 by the first main session, which stopped at 467 thousand tokens of context (the user's
global rule: the main session hands over before about 500 thousand). It is written for a main session that has
read nothing. Read it whole, then follow "What to do first".

**Update 2026-10-23 15:34**: the user told the first main session to "continue regardless of the limit", so it
carries on and runs the tasks itself. This file is now the fallback if that session dies: the status file's top
section says how far it got.

## 1. Where it stands

- **Nothing is built yet.** The design, the briefs and the repo skeleton are done. No agent is running: the lead
  of task A was started and stopped within a minute, before it wrote anything.
- Repo: `C:\Repos\My projects\claude-code-extensions`, a git repository with **no commits** (everything
  untracked). The user will create the GitHub repo `claude-code-extensions` themselves (an agent cannot: see the
  user's global instructions on GitHub tokens). **Commits: not allowed yet.** Ask the user before the first one.
- On disk:
  - `README.md`, `.gitignore` at the root.
  - `claude-toolbar\package.json` with devDependencies installed (`node_modules\`); `contributes` is `{}`.
  - `misc\implementation\chat-view\`: `CHAT_VIEW_WORKER_BRIEF_CLAUDE.md` (the design, the facts with evidence,
    the rules: the backbone of everything), `CHAT_VIEW_LEAD_BRIEF_CLAUDE.md` (the user's lead template, filled
    in), `CHAT_VIEW_STATUS_CLAUDE.md`, `CHAT_VIEW_SIZES_CLAUDE.md`, and this file.
  - `temp\chat-view\plugin-authoring\`: a copy of the Claude Code mod API reference (`reference.md`,
    `examples\`, `types\claude-code.d.ts`), because the original under `%TEMP%\claude\bundled-skills\` is
    temporary.
- A memory note points future sessions at this repo: `claude-code-extensions-repo.md` in the xpp-agent project's
  memory folder.
- **Waiting for the user: nothing.**

## 2. What the user asked for, and every answer they gave (2026-10-23)

In their words, in order:

1. "add a button at the top right that will toggle ... hide claudes' actions and only display my prompts and
   answers". Reason: "sometimes i dont remember what i asked so i want to be able to quickly scroll up and see my
   prompt."
2. Told that the VS Code extension already has Focus view (`ctrl+alt+f`) but no top-right button, and that a
   Claude Code mod cannot place a button there: "yes build it, it will be a toolbar also for other tools i want
   to add later".
3. Location: "it should live where the vs code or claude code extensions should with the caveat that i will
   have a github repo called "claude-code-extensions" with all the extensions such as this toolbar, so it will
   be committed". Read as: the repo above, one folder per extension; installed copies go where VS Code puts
   extensions.
4. How buttons are added: chose "One small file per button" (the build writes package.json's menu entries from
   the button files).
5. After trying Focus view: "the focus view feature doesnt hide claude's thinking process and actions fully, it
   just shows it in one line, i want this toggle button to fully hide claude's actions".
6. "lets create a toggle of three options, one that shows everything like now, one that shows thinking and one
   that doesnt show thinking or actions".
7. Told that thinking lines cannot be hidden by a mod or a setting: "for options 3 is there no way to hide all
   claude output?"
8. Offered (a) thinking off, (b) a filter program: "i dont want to turn off thinking, i just dont want it to show
   in the user output".
9. Asked whether the filter would keep thinking from Claude itself: "with the filter the thinking wont be passed
   to claude?" Answered: Claude keeps its thinking; the filter only changes what the chat window receives.
10. Final: "focus view for now, but also build the filter too and test it hard, when it'd done add it to the
    toggle".

## 3. The plan (details in the worker brief, sections 1 and 8)

- Task A, `claude-toolbar\` (VS Code extension): the toolbar and its three-view button; view 3 = Focus view for
  now. Ends with `claude-toolbar.vsix`, which the main session installs.
- Task B, `hide-actions\` (Claude Code mod): removes tool-call rows in the VS Code chat while the bridge file says
  `hideActions`. Makes view 2 work. The main session installs it through a folder marketplace.
- Task C, `chat-filter\` (C# .NET 10 wrapper exe): keeps thinking out of the chat while the bridge file says
  `hideThinking`; tested hard (worker brief 8.5, five levels). The main session publishes it and sets
  `claudeCode.claudeProcessWrapper`, with the user's go.
- Then 8.6: view 3 switches from Focus view to "actions hidden + thinking filtered".
- Order: A, then B, then C, then 8.6. One working agent at a time (7.8 GB machine, about 2 GB free). One lead per
  task, started when the task starts; a lead may read beside a running worker.

## 4. What to do first

1. Load the `orchestrate-agents` skill and follow it. The user wants `effort: "max"` on every agent; agents of
   type `general-purpose`, no `model` (they inherit).
2. Read `misc\implementation\chat-view\CHAT_VIEW_WORKER_BRIEF_CLAUDE.md` sections 1, 3 and 8.1 only (you need the
   picture, not the details; the leads read the rest). Do not read Claude's extension or webview code yourself:
   that is what filled the first main session. Delegate any such reading.
3. Measure your own context (the user's global instructions say how) after reading in, and after each task.
4. Check free memory, then start the lead of task A with the message in section 5, then its watcher:
   `& 'C:\Users\user\.claude\skills\orchestrate-agents\scripts\watch-agent.ps1' -AgentId <id> -SessionId <your session id> -WarnTokens 380000`
   in the background (workers: `-WarnTokens 400000`). Your session id is the folder name in your scratchpad path.
5. Tell the user in one line that task A has started.

## 5. The start message for the lead of task A

Read the clock and put the real time where it says so. Start it with `run_in_background: true`.

> You are the task lead for task A, the toolbar, of the chat-view work in the repo
> `C:\Repos\My projects\claude-code-extensions`. Task A is the VS Code extension `claude-toolbar\`: buttons at the
> top right of the Claude Code chat in VS Code, and its first button, which cycles three views of the chat. The
> user's words: "a toggle of three options, one that shows everything like now, one that shows thinking and one
> that doesn't show thinking or actions", and "it will be a toolbar also for other tools I want to add later".
> You write no product code: you cut the task into worker runs, write each worker's task message, answer your
> workers' questions, check each result yourself, and report to me. I am the main session; my id for SendMessage
> is `main`. I am the only one who can start an agent and the only one who talks to the user. I start your
> workers when you end your turn with the START WORKER line, and I watch your context size and theirs.
>
> Read, in this order, and no more:
> 1. `misc\implementation\chat-view\CHAT_VIEW_LEAD_BRIEF_CLAUDE.md`, whole; it binds you.
> 2. From `misc\implementation\chat-view\CHAT_VIEW_WORKER_BRIEF_CLAUDE.md`: sections 1 to 6 whole; 7.1 and 7.2;
>    8.1, 8.2, 8.3 and 8.6; 9; 10; 11. Skip 7.3, 7.4, 7.5, 8.4 and 8.5 (other tasks).
> 3. `misc\implementation\chat-view\CHAT_VIEW_SIZES_CLAUDE.md`; read it again at each wake-up.
>
> The baseline, verified by me at <real time>: nothing of the extension is built and there are no tests.
> `claude-toolbar\package.json` exists with its devDependencies installed (`node_modules\` present); its
> `contributes` is `{}`. The repo is a git repository with no commits; everything is untracked. Never commit
> yourself.
>
> Task A's scope: everything in worker brief 8.3, with view 3 as Claude's Focus view (8.1, "answers, now"),
> ending with a packaged `claude-toolbar.vsix` that I install. 8.6 (switching view 3 to the filter) is NOT part
> of this task now; design so that it is a small data change later. Components B (the mod) and C (the filter)
> are other tasks; do not build them.
>
> Sizing: a worker reaches 400 thousand after about 100 tool calls whatever the task; a run holds two real points
> and a check against real material; I warn each worker at 400 thousand. The check that breaks one rule at a time
> is never dropped; if it does not fit a run, it gets a run of its own. The user wants every decision that changes
> what an agent or they would see, soon and with an example (the icons and tooltips of the three looks are such a
> decision). Still waiting for the user: nothing. Before anything against a live system or outside the repo, ask
> me with QUESTION FOR MAIN. The machine has about 2 GB of free memory: one working agent at a time, one heavy
> command at a time.
>
> Your first turn ends with your plan in `misc\implementation\chat-view\CHAT_VIEW_TOOLBAR_LEAD_CLAUDE.md`, the
> first worker's task message in `temp\chat-view\A1_TASK.md`, and the START WORKER line as the last line of your
> message.

Leads of tasks B and C get the same message shape: B reads worker brief 7.3, 7.4, 8.2, 8.4 (and the mod API copy
under `temp\chat-view\plugin-authoring\` by section); C reads 7.2, 7.3, 8.2, 8.5, 8.6. Each lead's file is
`CHAT_VIEW_<TASK>_LEAD_CLAUDE.md`.

## 6. What only the main session does, with the exact steps

Each needs a clear line to the user first; the last two need the user's go.

- **Install the toolbar**: `code --install-extension "C:\Repos\My projects\claude-code-extensions\claude-toolbar\claude-toolbar.vsix" --force`;
  check with `code --list-extensions --show-versions`. VS Code should pick it up without a reload; if the icon
  does not show, the user reloads the window themselves (it restarts their open Claude chats, which they can
  reopen). Never reload it for them.
- **Install the mod** (bundled CLI `%USERPROFILE%\.vscode\extensions\anthropic.claude-code-2.1.306-win32-x64\resources\native-binary\claude.exe`):
  `claude plugin marketplace add "C:\Repos\My projects\claude-code-extensions"`, then
  `claude plugin install hide-actions@claude-code-extensions`. New chats load it; an open chat after
  `/reload-plugins`.
- **Install the filter**: publish to `%LOCALAPPDATA%\claude-code-extensions\chat-filter\<version>\chat-filter.exe`
  and set `claudeCode.claudeProcessWrapper` to that path (user setting). Only new chats use it. Rollback: clear
  the setting.
- **8.6**: install the new toolbar version after the filter is in.

## 7. What the user should hear at each step

- After A: the button is there; views 1 and 3 work; view 2 needs B.
- After B: view 2 works (tool calls disappear; thinking lines stay).
- After C passes: what was tested, in numbers; then the go to install it and switch view 3.
- Always: what is not done yet, plainly.

## 8. Lessons from the first session

- Reading Claude's minified webview and extension code (6 MB and 3.5 MB files) in the main session cost most of
  its 467 thousand tokens. The facts it found are now in the worker brief, section 7, with their evidence: do
  not read those files again; a lead or worker that needs more reads them by a narrow search.
- Every time written into a message or file must come from the clock. The first main session wrote a guessed
  "16:40" into a start message (the real time was about 15:27); that message was never acted on.
