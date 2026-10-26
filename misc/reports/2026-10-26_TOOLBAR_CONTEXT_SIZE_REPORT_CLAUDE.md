# Context size in the Claude toolbar

## Session 1: the context size as text left of the toolbar buttons

- **When:** 2026-10-26, one session started from xpp-agent. Plan: `C:\Users\user\.claude\plans\luminous-baking-gosling.md`
  (approved by the user). There is no next plan.
- **Short version:** the Claude chat's toolbar now starts with the chat's context size as text, such as `240k`, left
  of the eye and palette buttons. It updates about a second after each of Claude's steps.

### What is different now

- **You see the context size at the top right of every Claude chat**, in the side bar and in a chat opened as an
  editor tab. A chat at 239,829 tokens shows `240k`. A new chat shows `0k` until Claude's first answer, and the
  text reads `1000k+` from a million tokens up.
- **The number comes from the chat's transcript.** It uses the same sum the session watch uses: the latest step's
  input, cache-creation and cache-read tokens. Steps an error stopped are skipped.
- **Two new settings** under "Claude Toolbar": the refresh wait (`claudeToolbar.contextRefreshMs`, 1000) and how much
  of the transcript's end is read (`claudeToolbar.contextTailBytes`, 4 MB).
- **A look of a toolbar button may have no icon**, and then shows as text. That is how the number shows: one hidden
  command per value from `0k` to `1000k+`, written by `npm run manifest`. `package.json` grew to 689 KB.

### Decisions

- Placed in the toolbar, at the far left of the buttons, showing tokens only: the user's choices.
- One command per thousand (not per 5k), read by the extension itself (no mod), and a click that does nothing: my
  proposals in the approved plan.

### What was checked

- `npm run typecheck`, `npm test` (214 tests), `npm run package`, then `npm run test:integration` (16 tests) on the
  project and on the copy installed in VS Code. All pass.
- The reader against this session's real transcript gave 239,829 tokens. The session watch's formula gave the same.
- **Not checked:** how the text looks in the VS Code chat. VS Code must be reloaded to load the new extension.

### Concerns

- With several Claude chats open in one window, every chat shows the size of the chat Claude wrote to last.
- It is the main chat's size only, not its agents'.

### Committed

- No. Nothing in this repository is committed yet.
