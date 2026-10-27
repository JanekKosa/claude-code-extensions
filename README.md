# Claude Code extensions

Add-ons for Claude Code in VS Code, one folder each.

| Folder | What it is | State |
| --- | --- | --- |
| `claude-toolbar\` | VS Code extension: buttons at the top right of the Claude chat. From the left: the chat's context size as text (`212k`), a button that switches Claude's Focus view on and off, and one that shows the Chat colors pane. | being built |
| `hide-actions\` | Claude Code mod: removes Claude's tool calls from the VS Code chat while the toolbar asks for it. | planned |
| `agents-pane\` | Claude Code mod: a pane above the prompt that lists every agent of the session, each workflow's agents under the workflow's name. `/agents-pane` shows or hides it. | built, tested |
| `decisions-pane\` | Claude Code mod: a Decisions tab beside the Agents tab that lists the decisions the agent team's register waits for you on, each with its urgency, a pick list or text box, and Submit, which records your answer. `/decisions-pane` shows or hides it. | built, tested |
| `chat-filter\` | Windows program that VS Code starts instead of Claude. It passes everything through, but keeps Claude's thinking out of the chat while the toolbar asks for it. Claude itself still thinks and keeps its thinking. | planned |

`skills\claude-code-mods\` holds the `claude-code-mods` skill: what was learned on this machine while building these
mods. It is linked by hand into `~\.claude\skills` and `~\.copilot\skills`.

`misc\implementation\` holds the plans of work in progress.
