# chat-colors

A Claude Code mod that colours the VS Code chat: a tinted band, one line high with a thin border, right above each
of your prompts, each note of Claude's and each answer of Claude's. The colours come from the Claude toolbar's
colour wheel. The messages themselves stay exactly as the chat draws them: formatting, code highlighting, links and
the "Copy response" button.

Example: Claude reads two files, says "Let me run the tests.", runs `npm test` and ends with "All 12 tests pass."
Your prompt gets a blue band, "Let me run the tests." an amber band (a note), "All 12 tests pass." a green band (the
answer). The "Thought for 4s" lines are the chat's own and get no band.

## What is a note, what is the answer

- **A note** is a text of Claude's that a tool call follows in the same turn.
- **The answer** is the text that no tool call follows, once the turn has ended.
- While a turn runs, its newest text is a note; it becomes the answer when the turn ends without another tool call.
- A text the chat marks as a summary is a note.
- The rows of a resumed chat are sorted the same way when the session starts.

The mod tells rows apart by their text. Two identical texts in one chat share one colour: the newer one decides.
Example: "Done." ends one turn (an answer) and later opens a step before a tool call (a note); both "Done." rows
then show the note colour.

## Why a band and not a card

Claude's VS Code chat (checked on 2.1.306) draws a mod's drawing for a message above the message, never around it.
A card holding the message would have to redraw the text itself, with a simpler Markdown and without the copy
button. So the band sits on its own above the message. On the terminal the same drawing gives the same picture: the
band, then the message.

## The bridge file

The toolbar writes `%USERPROFILE%\.claude\claude-code-extensions\chat-view.json` (version 2 of the contract):

```json
{"colors":{"prompt":"#4FA3E0","notes":"#D29922","answer":"#3FB950"},"tintPercent":15}
```

- A colour is `#RRGGBB` or `null` (no band for that kind). Anything else reads as `null`.
- `tintPercent` is an integer from 0 to 100: how strongly the band's background shows the colour. Anything else
  reads as 15.
- No file: no bands. A file that cannot be read now, or is not valid JSON (a write under way): the colours stay as
  they were.
- The mod opens, reads and closes the file at once, every `pollMs`, so the toolbar can always replace it. A change
  redraws the rows on screen within one poll.

## Options (`/config`)

| Option | Default | What it does |
| --- | --- | --- |
| Bridge poll interval (ms) | 500 | How often the bridge file is read. At least 100. |
| Colour the chat on | `vscode` | Comma-separated surfaces from `vscode`, `desktop`, `terminal`, `mobile`. |
| Band height (lines) | 1 | How tall each band is. At least 1. |

## Checks

With the `claude.exe` that ships with Claude's VS Code extension:

- `claude plugin validate chat-colors` and `claude plugin validate .` (the repo root holds the marketplace);
- `claude plugin test chat-colors`;
- a type-check with the `tsconfig.json` printed in the header of the mod API's types, kept outside this folder.
