const chalk = require('chalk');
const ui = require('../../ui/framework');
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
    ui.success('No conflicts found');
    return;
  }

  // Get file to resolve
  if (!fileName) {
    const options = conflictedFiles.map((file) => ({
      value: file,
      label: chalk.yellow(file),
    }));

    fileName = await ui.prompt.select({
      message: 'Select file to resolve:',
      options,
    });

    if (fileName === null) return;
  }

  if (!conflictedFiles.includes(fileName)) {
    ui.warn(`File ${fileName} is not in conflict`);
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
    ui.error(`Failed to open editor: ${error.message}`, { exit: true });
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
    ui.success(`File ${fileName} resolved and staged`);
    const theme = getTheme();
    console.log(
      theme.dim('Continue with: gittable rebase --continue or gittable merge --continue')
    );
  } else {
    ui.warn('File not staged. Resolve conflicts and stage manually.');
  }
};
