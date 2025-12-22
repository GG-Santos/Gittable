const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getCurrentBranch, execGit } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
  handleCancel,
} = require('../../utils/commands');
const { ensureRemoteExists } = require('../../utils/git');
const { getTheme } = require('../../utils/ui');

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
    oldName = await ui.prompt.text({
      message: 'Current branch name:',
      placeholder: current || 'feature/old-name',
      initialValue: current || '',
    });

    if (oldName === null) return;
  }

  // Get new name
  if (!newName) {
    newName = await ui.prompt.text({
      message: 'New branch name:',
      placeholder: 'feature/new-name',
    });

    if (newName === null) return;
  }

  if (oldName === newName) {
    ui.warn('Branch names are the same');
    return;
  }

  // Confirm
  const confirmed = await promptConfirm(`Rename branch "${oldName}" to "${newName}"?`, false);

  if (!confirmed) {
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
      ui.success('Branch renamed locally');
      ui.warn(`Note: Old branch still exists on ${remote}`);
    }
  } else {
    ui.success('Branch renamed successfully');
  }
};
