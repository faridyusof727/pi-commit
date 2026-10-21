# Pi Commit

Generate git commit messages in VS Code with the `pi` agent CLI (`@earendil-works/pi-coding-agent`).

## Usage

1. Stage the changes you want to commit. If nothing is staged, all working changes (including untracked files) are used.
2. Click the sparkle button in the Source Control title bar, or run **Generate Commit Message (pi)**.
3. The message appears in the commit input box.

## Settings

| Setting           | Description                                                                                   |
|-------------------|-----------------------------------------------------------------------------------------------|
| `piCommit.model`  | **Required.** Model passed to `pi --model`, e.g. `anthropic/claude-sonnet-5-5`.               |
| `piCommit.prompt` | Style instructions for the commit message. The diff and output rules are added automatically. |
| `piCommit.path`   | Path to the `pi` executable. Default: `pi` on `PATH`.                                         |

## Requirements

`pi` must be installed and signed in to the provider of the selected model.
