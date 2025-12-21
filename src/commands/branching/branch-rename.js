const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getCurrentBranch, execGit } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
  handleCancel,
} = require('../../utils/command-helpers');
const { ensureRemoteExists } = require('../../utils/remote-helpers');
const { getTheme } = require('../../utils/color-theme');

/**
 * Branch-rename command - Rename branch locally and remotely
 */
module.exports = async (args) => {
  showCommandHeader('BRANCH-RENAME', 'Rename Branch');

  requireTTY('Please use: git branch -m <old> <new> for non-interactive mode');

  let oldName = args[0];
  let newName = args[1];
  const current = getCurrentBranch();
  const remote = args[2] || 'origin';

  // Get old name
  if (!oldName) {
    const theme = getTheme();
    oldName = await clack.text({
      message: theme.primary('Current branch name:'),
      placeholder: current || 'feature/old-name',
      initialValue: current || '',
    });

    if (handleCancel(oldName)) return;
  }

  // Get new name
  if (!newName) {
    const theme = getTheme();
    newName = await clack.text({
      message: theme.primary('New branch name:'),
      placeholder: 'feature/new-name',
    });

    if (handleCancel(newName)) return;
  }

  if (oldName === newName) {
    clack.cancel(chalk.yellow('Branch names are the same'));
    return;
  }

  // Confirm
  const confirmed = await promptConfirm(`Rename branch "${oldName}" to "${newName}"?`, false);

  if (!confirmed) {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  // Rename locally
  await execGitWithSpinner(`branch -m ${oldName} ${newName}`, {
    spinnerText: 'Renaming branch locally',
    successMessage: null,
    errorMessage: 'Failed to rename branch locally',
  });

  // Check if remote exists and has the branch
  const remoteCheck = execGit(`ls-remote --heads ${remote} ${oldName}`, { silent: true });
  const hasRemoteBranch = remoteCheck.success && remoteCheck.output.trim().length > 0;

  if (hasRemoteBranch) {
    const pushRemote = await promptConfirm(
      `Branch exists on ${remote}. Push renamed branch and delete old one?`,
      true
    );

    if (pushRemote) {
      // Push new branch
      await execGitWithSpinner(`push ${remote} ${newName}`, {
        spinnerText: `Pushing new branch to ${remote}`,
        successMessage: null,
        errorMessage: 'Failed to push new branch',
      });

      // Set upstream
      await execGitWithSpinner(`push ${remote} -u ${newName}`, {
        spinnerText: 'Setting upstream',
        successMessage: null,
        errorMessage: 'Failed to set upstream',
        silent: true,
      });

      // Delete old remote branch
      await execGitWithSpinner(`push ${remote} --delete ${oldName}`, {
        spinnerText: `Deleting old branch from ${remote}`,
        successMessage: 'Branch renamed successfully',
        errorMessage: 'Failed to delete old remote branch',
      });
    } else {
      clack.outro(chalk.green('Branch renamed locally'));
      console.log(chalk.yellow(`Note: Old branch still exists on ${remote}`));
    }
  } else {
    clack.outro(chalk.green('Branch renamed successfully'));
  }
};
