const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execSync } = require('node:child_process');
const { execGit } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  handleCancel,
  execGitWithSpinner,
} = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

/**
 * Resolve command - Open file in editor with conflict markers highlighted
 */
module.exports = async (args) => {
  showCommandHeader('RESOLVE', 'Resolve Conflicts');

  requireTTY('This command requires interactive input');

  let fileName = args[0];

  // Get conflicted files
  const conflictsResult = execGit('diff --name-only --diff-filter=U', { silent: true });
  const conflictedFiles =
    conflictsResult.success && conflictsResult.output.trim()
      ? conflictsResult.output.trim().split('\n').filter(Boolean)
      : [];

  if (conflictedFiles.length === 0) {
    clack.outro(chalk.green('No conflicts found'));
    return;
  }

  // Get file to resolve
  if (!fileName) {
    const options = conflictedFiles.map((file) => ({
      value: file,
      label: chalk.yellow(file),
    }));

    const theme = getTheme();
    fileName = await clack.select({
      message: theme.primary('Select file to resolve:'),
      options,
    });

    if (handleCancel(fileName)) return;
  }

  if (!conflictedFiles.includes(fileName)) {
    clack.cancel(chalk.yellow(`File ${fileName} is not in conflict`));
    return;
  }

  // Get editor from git config or environment
  const editorResult = execGit('config --get core.editor', { silent: true });
  const editor =
    editorResult.success && editorResult.output.trim()
      ? editorResult.output.trim()
      : process.env.EDITOR || process.env.VISUAL || 'nano';

  console.log(chalk.cyan(`\nOpening ${fileName} in ${editor}...`));
  console.log(chalk.dim('Look for conflict markers: <<<<<<<, =======, >>>>>>>'));
  console.log();

  try {
    // Open file in editor
    execSync(`${editor} ${fileName}`, { stdio: 'inherit' });
  } catch (error) {
    clack.cancel(chalk.red(`Failed to open editor: ${error.message}`));
    console.log(chalk.yellow(`\nYou can manually edit: ${fileName}`));
    return;
  }

  // Ask if resolved
  const { promptConfirm } = require('../../utils/command-helpers');
  const resolved = await promptConfirm(`Have you resolved conflicts in ${fileName}?`, true);

  if (resolved) {
    // Stage the file
    await execGitWithSpinner(`add ${fileName}`, {
      spinnerText: 'Staging resolved file',
      successMessage: `File ${fileName} staged`,
      errorMessage: 'Failed to stage file',
      silent: true,
    });

    console.log();
    clack.outro(chalk.green(`File ${fileName} resolved and staged`));
    console.log(
      chalk.dim('Continue with: gittable rebase --continue or gittable merge --continue')
    );
  } else {
    clack.outro(chalk.yellow('File not staged. Resolve conflicts and stage manually.'));
  }
};
