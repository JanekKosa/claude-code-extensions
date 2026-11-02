# Setting up on a Windows machine

For an agent, or a person, setting these add-ons up on a machine. `setup.ps1` does the work; follow these steps and
do not run its commands by hand.

## Steps

1. Check that the machine has Git, Node.js 20 or newer, and VS Code 1.140 or newer. Install what is missing. Claude's
   VS Code extension is installed by the script if it is not there.
2. Clone the repository, if it is not on the machine yet. Any folder will do, spaces in the path included:

   ```powershell
   git clone https://github.com/JanekKosa/claude-code-extensions.git
   ```

3. Run the script from the repository's root:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\setup.ps1
   ```

   It takes a few minutes, and ends with `SETUP DONE.` and exit code 0, or `SETUP FAILED: <the reason>` and exit
   code 1. Fix the reason and run it again; a second run is safe.
4. Report every `WARNING:` line to the user. They do not stop the setup, but they name something that will not work.
5. Tell the user to run **Developer: Reload Window** in VS Code. Nothing shows until then. An agent running in VS Code
   must not do this itself: the reload ends its own chat.
6. After the reload, check with the user: the context size (such as `212k`) and two buttons show at the top right of
   the Claude chat, and `/agents-pane` answers in the chat.

## What the script does

1. Finds VS Code and `claude.exe`, and stops if a version is too old.
2. Builds `claude-toolbar\`, runs its type-check, unit tests and integration tests, and packs `claude-toolbar.vsix`.
3. Installs the package into VS Code and checks the installed copy against the build.
4. Validates and tests each mod the marketplace lists, adds this folder as the marketplace `claude-code-extensions`,
   installs the mods for the user, and checks that each is enabled and read from this folder.
5. Links each folder of `skills\` into `~\.claude\skills`, and into `~\.copilot\skills` if `~\.copilot` exists.

A failed check stops it before anything further is installed. It leaves out `hide-actions\` and `chat-filter\`, which
are still planned and not in the marketplace.

## What the setup does not bring

| Add-on | Needs | Without it |
| --- | --- | --- |
| `decisions-pane` | The agent team: `~\.claude\skills\orchestrate-agents`, with `/software-developer-agent`. It is not in this repository. | The mod is installed, but the pane never shows. |
| `chat-colors` | A colour for each band you want, picked in the toolbar's Chat colors pane (Prompt band, Notes band, Answer band). No setup step can choose them. | The mod is installed, but it draws no bands. |

## Traps on this kind of machine

- **`code` on the PATH may not be VS Code.** Cursor installs a `code` of its own, and an install through it lands in
  Cursor, without an error. The script looks for VS Code in its install folders instead. Use the same path if you run
  it by hand: `%LOCALAPPDATA%\Programs\Microsoft VS Code\bin\code.cmd`.
- **`claude` on the PATH may be old.** Use the `claude.exe` of the newest
  `%USERPROFILE%\.vscode\extensions\anthropic.claude-code-<version>-win32-x64\resources\native-binary\`.
- **The clone must stay where it is.** The mods are read from the repository's folder, not from a copy. After moving
  the folder, run the script again; it points the marketplace at the new place and renews the skill links. Claude
  deletes the mods' saved options when the marketplace is removed, so anything set in `/config` must be set again.
- **"N userConfig options not yet set" is harmless.** The mods' defaults apply.
- **`... is a real folder, not a link`** means a skill folder is already there and is not a link to this repository.
  The script does not touch it. Look at what it holds, move it away, and run the script again.

## After a `git pull`

- A change in a mod: run `/reload-plugins` in each open chat, or start a new chat.
- A change in `claude-toolbar\`: run `setup.ps1` again, then **Developer: Reload Window**.
