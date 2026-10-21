const vscode = require('vscode');
const { execFile } = require('child_process');

const run = (cmd, args, cwd, input, okCodes = [0]) =>
  new Promise((resolve, reject) =>
    execFile(cmd, args, { cwd, maxBuffer: 100 * 1024 * 1024 }, (err, stdout, stderr) =>
      err && !okCodes.includes(err.code) ? reject(new Error(stderr || err.message)) : resolve(stdout.trim())).stdin.end(input));

// Unstaged changes, including untracked files (git diff alone skips them).
const workingDiff = async (cwd) => {
  const untracked = (await run('git', ['ls-files', '--others', '--exclude-standard', '-z'], cwd)).split('\0').filter(Boolean);
  // git diff --no-index exits 1 when the files differ
  const added = await Promise.all(untracked.map((f) => run('git', ['diff', '--no-index', '--', '/dev/null', f], cwd, '', [0, 1])));
  return [await run('git', ['diff'], cwd), ...added].filter(Boolean).join('\n');
};

exports.activate = (context) => {
  context.subscriptions.push(vscode.commands.registerCommand('piCommit.generate', async (scm) => {
    const git = vscode.extensions.getExtension('vscode.git').exports.getAPI(1);
    const repo = git.repositories.find((r) => r.rootUri.toString() === scm?.rootUri?.toString()) ?? git.repositories[0];
    if (!repo) return vscode.window.showErrorMessage('No git repository found.');

    const { path, model, prompt } = vscode.workspace.getConfiguration('piCommit');
    if (!model?.trim()) {
      const open = await vscode.window.showErrorMessage('Set piCommit.model first.', 'Open Settings');
      if (open) vscode.commands.executeCommand('workbench.action.openSettings', 'piCommit.model');
      return;
    }

    const cwd = repo.rootUri.fsPath;
    const diff = (await run('git', ['diff', '--cached'], cwd)) || (await workingDiff(cwd));
    if (!diff) return vscode.window.showInformationMessage('No changes to describe.');

    const args = [
      '--model', model, '-p', '--no-session', '--no-tools', '--no-context-files',
      '--no-extensions', '--no-skills', '--no-prompt-templates',
      '--system-prompt', 'You write git commit messages. Your whole reply is used as the commit message.',
      `${prompt}\n\nWrite the commit message for the git diff above. Output only the commit message. ` +
        'Do not use code fences. Do not add any explanation, summary, or other text before or after the commit message.',
    ];

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.SourceControl, title: 'pi: generating commit message' },
      async () => {
        try {
          // pi puts stdin before the prompt with no separator, so fence the diff
          repo.inputBox.value = await run(path || 'pi', args, cwd, `<diff>\n${diff}\n</diff>\n\n`);
        } catch (e) {
          vscode.window.showErrorMessage(`pi failed: ${e.message}`);
        }
      });
  }));
};
