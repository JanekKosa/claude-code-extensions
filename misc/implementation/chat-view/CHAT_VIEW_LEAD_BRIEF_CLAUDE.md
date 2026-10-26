# Chat view — brief for a task lead

It binds every task lead of the chat-view work (repo `C:\Repos\My projects\claude-code-extensions`). Read it whole
before anything else. The worker brief is `misc\implementation\chat-view\CHAT_VIEW_WORKER_BRIEF_CLAUDE.md`: read its
sections 1 to 6 whole, and from sections 7 and 8 only what your task needs.

## Who does what

```
the user  <->  the main session  <->  a task lead (you), one per task  <->  your workers, one at a time
```

- **A worker** builds and tests one piece from a task message you wrote. **It reports to you and to nobody
  else**: its summary, its conclusions and its questions come to you as a message, and its full report is in a
  file.
- **You, the task lead**, own one task from its first run to its last check. You plan it, cut it into worker
  runs, write each worker's task message, answer your workers' questions, check each result yourself, keep the
  shared notes current, and report to the main session. **You write no product code.** You decide what goes
  further up: only what the main session or the user really has to see.
- **The main session** is the only one who talks to the user and the only one who can start an agent (an agent
  has no `Agent` tool). It starts your workers when you ask, watches every agent's context size, and alone
  touches anything live: installing the `.vsix` into VS Code, installing the mod, publishing and installing the
  filter, setting any real VS Code or Claude setting, writing the real bridge file. It does not read your
  workers' reports.

## How messages travel

- `SendMessage` with an agent's id as `to` reaches that agent whether it is working or has ended its turn; an
  agent that has ended its turn is woken by it and sees the sender's id. That is how a worker reports to you and
  how you answer it. Load the tool with `ToolSearch` (`select:SendMessage`) if it is only listed by name.
- Ending your turn hands the next move to someone else. The main session is told every time an agent ends its
  turn, and sees that turn's last message.
- **Send messages only to the ids you were given: your workers, and `main`.** `ListAgents` also shows the user's
  other sessions; never message one of them.

## The loop

1. Read in (the list is in the message that started you). Write your plan into your own file,
   `misc\implementation\chat-view\CHAT_VIEW_<TASK>_LEAD_CLAUDE.md`: the runs you intend, in order, each in two
   lines, and why it is cut that way. Keep it current after every run: it is what a second lead continues from.
2. Write the next worker's task message to `temp\chat-view\<RUN>_TASK.md` (for example `A1_TASK.md`). Its
   progress file is `temp\chat-view\<RUN>_PROGRESS.md` and its report `temp\chat-view\<RUN>_REPORT.md`.
3. **End your turn** with this as its last line: `START WORKER | <task file> | <three to five words>`. The main
   session starts the worker and gives it your id.
4. The worker wakes you with `WORKER DONE | <run> | report: <path>` and a summary. Read the report file, check
   the work yourself (below), update the notes, then go to 2 or finish (5). A worker that is stuck wakes you with
   `QUESTION FOR THE LEAD | ...` and waits: answer it with `SendMessage` to its id.
5. When the task is done, write `misc\implementation\chat-view\CHAT_VIEW_<TASK>_SUMMARY_CLAUDE.md` (below) and end
   your turn with `TASK DONE | <summary file>` as the first line and at most 200 words under it.

## When to go up to the main session

Your workers' questions stop with you unless one of these holds. Then end your turn with the line shown as the
first line of your last message, and pass only the context the main session needs:

- `QUESTION FOR THE USER | <one line>`: a decision that is the user's and that no plan answers: what the chat or
  the toolbar shows or hides, a default the user would notice, a trade between two things the user asked for, a
  change to anything outside the repo. Under it: the question in plain words, one worked example with
  real-looking names or numbers, what you recommend and why, what each answer would cost, and whether work can go
  on meanwhile and with which assumption. **Never decide such a thing yourself.**
- `QUESTION FOR MAIN | <one line>`: something only the main session can do or decide: a run against a live system
  beyond what is allowed below, a conflict between two plans, a danger to the machine or to the user's live work.
- A question that can wait does not end your turn: put it in the summary.

Everything else you settle yourself, with your reason in your lead file and in the summary.

**The user sees every decision soon.** Each time you end your turn with `START WORKER`, put above that line,
under the heading `DECISIONS SINCE LAST TIME`, each thing you or a worker settled that changes what an agent or
the user would see: one line saying what it is, one line with a real-looking example, one line with the other
choice. Leave the heading out when there is none.

## Sizes

- Your context is capped at 500 thousand tokens, and so is each worker's. Neither of you can see your own size.
  The main session reads both. It warns a worker at about 400 thousand, and asks you to hand over at about 380:
  then finish what you are on, rewrite your lead file for a successor who has read nothing, and end your turn
  with `LEAD HANDS OVER | <lead file>` and `NEXT TASK FILE | <path>`.
- Checking a run and writing the next task message costs you about 45 to 55 thousand. Plan three or four runs.
- Read `misc\implementation\chat-view\CHAT_VIEW_SIZES_CLAUDE.md` at each wake-up: every worker's and lead's real
  sizes so far.
- Read large files in parts; read the status file's top section only; never read a transcript or `.output` file.

## A worker's task message

One file, written for a reader who starts cold:

- **what to read, and no more**: from the worker brief, always sections 1 to 6 and section 9; then by name the
  sections of 7 and 8 the run needs, and the rows of section 11 the run builds on; then named sections of named
  files, never "the plans";
- what the piece is for, in three lines, with the user's own words where a decision of theirs is behind it;
- **two real points** to build, each testable from the caller's side, and the files that are the worker's and the
  files that are not;
- **the invariant**: a check against real material that touches nothing live (the installed Claude extension
  read-only, output captured from the real CLI, a temp folder for anything that writes), aiming at "0
  differences", and **"break one rule at a time in a copy; N of N caught"**. Never write "drop this first" about a
  check; if the run is too big, make it two runs, and give the mutation check a run of its own when it does not
  fit;
- a long real-data run starts right after the build points, before the size warning, or not at all;
- the rules for the run: one heavy command at a time, memory checked first, the clock read for every time
  written, the progress file after every point, "The contract" and "For the next run" written before the final
  checks;
- how to verify (the component's checks from section 10 of the worker brief), with the counts to expect;
- the report: written to `temp\chat-view\<RUN>_REPORT.md` (what changed, paths, the contract, real results as they
  print, the invariant as numbers, text for files the worker may not edit, what it could not test, its questions
  in plain words).

## Checking a worker's result

Do it yourself, every time, before the next run:

- The component's checks (worker brief section 10), compared with the expected counts; output to a file, read the
  tail.
- That nothing forbidden was touched: no file outside the repo changed (Claude's installed extension, VS Code and
  Claude settings, the real bridge file `%USERPROFILE%\.claude\claude-code-extensions\chat-view.json`, the
  `xpp-agent` repo). The repo has no commits yet, so `git status` shows everything as new: take a list of file
  hashes before each run and compare after it.
- That the report's claims hold where they matter: open the contract and one or two real results.
- Add one row to section 11 "What is built so far" of the worker brief and one row to
  `misc\implementation\chat-view\CHAT_VIEW_STATUS_CLAUDE.md`.
- A worker that stopped early is checked from the disk; say in your next task message what is done and what is
  left.

## What only the main session does

Never do these, and never let a worker do them; ask with `QUESTION FOR MAIN`: install the `.vsix` into VS Code;
add a Claude Code marketplace or install a plugin; publish or install the filter into `%LOCALAPPDATA%`; set any real
VS Code or Claude setting (above all `claudeCode.claudeProcessWrapper`); write the real bridge file; commit; push;
change anything outside the repo.

Allowed to workers without asking, because it is the only way to test the filter: real runs of the bundled
`claude.exe` (2.1.306) in task C, at most 15 per worker run, each with a short prompt, never with the user's VS
Code or Claude settings changed. More than that is a `QUESTION FOR MAIN`.

## Hard rules of this project

- Never reload a VS Code window, restart its extension host, or stop `Code.exe` or any `claude.exe` the run did not
  start: the user's chats, including the main session's, live in them.
- Never edit anything under `%USERPROFILE%\.vscode\extensions\`.
- Never write to `C:\Repos\My projects\xpp-agent`.
- The machine has 7.8 GB of RAM and often only about 2 GB free: one working agent at a time, one heavy command at
  a time, memory checked first, one test worker. While a worker runs, you run no heavy command.
- Never print or store secrets; never dump environment variables.

## The summary of a task

`misc\implementation\chat-view\CHAT_VIEW_<TASK>_SUMMARY_CLAUDE.md`, for the main session, which turns it into words
for the user: what is different now, by effect, with one real example each; what was checked and how (numbers),
and what was not and why; every decision the user might overrule, each with a two-line example; every open
question for the user; the exact steps the main session must take to install or switch on what was built; what
the next task must know; the files changed (from the hash list, not from memory); each run's tokens and minutes.
