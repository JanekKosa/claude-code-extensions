# agents-pane

A Claude Code mod that shows every agent of the session in a pane above the prompt of the VS Code chat (and the
terminal, desktop and mobile chats). Claude's own agent view under the prompt shows a workflow as one line; this pane
shows each agent the workflow starts, under the workflow's name.

Example: Claude starts an Explore subagent, then a workflow `review-changes` with two agents. The pane reads:

```
3 agents · 1 running

✓ find label usages · haiku-5-5 · medium · done · 16k context · 41s

⏷ review-changes · workflow · 1/2 done · 1 running · 38s
    ✓ review:bugs · sonnet-5-5 · high · done · 52k context · 30s
    ● review:perf · sonnet-5-5 · high · running · 48k context · 38s
```

## What it lists

- **Subagents** the Agent tool starts, from the main chat or from another agent. An agent another agent started sits
  under it, one step in (a task lead's workers under the lead).
- **Workflow agents**, grouped under a header line with the workflow's name (the `name` in the script's `meta`). The
  arrow in front, ⏷ open and ⏵ folded, is the only clickable part: a faint button (transparent, with VS Code's thin
  grey outline, which a mod cannot remove). A workflow is open while one of its agents runs and folds once all have
  ended; a click on the arrow folds or opens it. The name and counts are plain text, as on an agent's row.
- **Teammates**, which show `idle` between turns.

Each line shows, in this order:

- the state mark, and what the agent is for (the task description it was given);
- its model;
- its effort (`low` to `max`), from its first model request on;
- its status: running, idle, done, failed or stopped;
- its context size: the tokens its context held after its latest model request (`48k context`);
- how long it has run, or ran.

An agent started by another agent or by a workflow sits four characters right of its parent. An agent or workflow
and everything under it form one block, with no blank line inside; a blank line parts two blocks.

| Mark | State |
| --- | --- |
| ● | running |
| ○ | idle (a teammate waiting for a message) |
| ✓ | done |
| ✗ | failed (an error or a refusal ended it) |
| ■ | stopped (interrupted) |

The pane knows the agents that started while the mod was loaded. A `/clear` empties it.

## Installing it

This repository's root is a marketplace (`.claude-plugin\marketplace.json`). On this machine it is added from its
folder, so the installed mod is read from `agents-pane\` itself and an edit takes effect after `/reload-plugins`:

```
claude plugin install agents-pane@claude-code-extensions --scope user
```

Once the repository is on GitHub: `/plugin install agents-pane --marketplace <owner>/<repo>`.

## Showing and hiding it

- It opens by itself when the first agent starts.
- `/agents-pane` shows or hides it. Once you close it (its close mark or the command), it stays closed until you run
  `/agents-pane` again.

## Options (`/config`)

| Option | Default | What it does |
| --- | --- | --- |
| Open the pane when an agent starts | on | Off: the pane opens only on `/agents-pane`. |
| Running-time refresh (ms) | 1000 | How often running times are redrawn while an agent runs. At least 250. |
| Agents kept | 300 | How many agents the pane remembers; the oldest ended ones go first. At least 10. |
| Agent name length (characters) | 48 | How much of an agent's name is shown. At least 10. |
| Space between agents (lines) | 1 | Blank lines between two blocks (independent agents or workflows). |
| Space between sub-agents (lines) | 0 | Blank lines between the rows inside one block. |
| Indent of a sub-agent (characters) | 4 | How far a sub-agent sits right of its parent. At least 1. |
## Checks

With the `claude.exe` that ships with Claude's VS Code extension:

- `claude plugin validate agents-pane`;
- `claude plugin test agents-pane`;
- a type-check with the `tsconfig.json` printed in the header of the mod API's types, kept outside this folder.
