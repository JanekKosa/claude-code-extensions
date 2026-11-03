# Resolved decisions

Questions, initiatives and issues that are closed, newest last. Each ends with a Final answer line (the user's last answer), a Summary line and a Resolved line that gives the outcome; every answer the user gave is kept in ANSWERS_LOG_CLAUDE.jsonl.

## D-1 · question · not-blocking
- Urgency: low
- Raised: 2026-10-26 14:45 by main session (decisions-pane fixes)
- Task: decisions-pane: comment box
- What: The comment box cannot wrap, grow or take a new line: VS Code draws a mod's text box as a one-line field. Should the pane show your comment, wrapped, under the box so you can read it whole?
- Example: You type 120 characters; the box shows the last 60 and scrolls. With A, all 120 also appear under the box on two lines, dim.
- Options: A: show the comment wrapped under the box once it is longer than about 60 characters (30 minutes). B: leave the one-line box as it is (none).
- Recommendation: A, because it is the only way to read a long comment before sending it.
- Meanwhile: The box stays one line; your text is no longer lost on Ctrl+Tab.
- Evidence: The VS Code chat's own code draws a mod's text box as a plain one-line input (webview\index.js, Claude Code 2.1.310)
- Final answer: 2026-10-26 16:05: "Chose B: leave the one-line box as it is (none)."
- Summary: Chose B: the comment box stays one line; no wrapped copy under it. Nothing changed.
- Resolved: 2026-10-26 16:05, answered

## D-2 · question · not-blocking
- Urgency: low
- Raised: 2026-11-03 01:33 by main chat
- Task: Decisions pane spacing
- What: Does this spacing look right in the pane?
  - This entry is only here so you can see the spacing.
- Example: Half a line sits above this field's neighbours, and a whole line sits above this Example.
- Options:
  - A: keep the spacing as it is (no work).
  - B: change it, and say how in the box (a few minutes).
- Recommendation: A, because it follows the rule you gave.
  - This second point should sit right under the first, with no gap.
- Meanwhile: Nothing waits on this. The change stays uncommitted until you ask.
- Evidence: decisions-pane\hooks\pane.tsx
- Final answer: 2026-11-03 01:35: "looks good, push"
- Summary: Keep the spacing: half a line between the title and the question, and between Example, Recommendation and Meanwhile; a whole line everywhere else.
- Resolved: 2026-11-03 01:35, answered
