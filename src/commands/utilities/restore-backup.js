const chalk = require('chalk');
const ui = require('../../ui/framework');
const {
  showCommandHeader,
  execGitWithSpinner,
  handleCancel,
} = require('../../utils/commands');
const { execGit, getBranches } = require('../../core/git');
const { getTheme } = require('../../utils/ui');

/**
 * Restore from backup branch
 */
module.exports = async (args) => {
  showCommandHeader('RESTORE-BACKUP', 'Restore from Backup');

  let backupBranch = args[0];

  if (!backupBranch) {
    // List backup branches
    const branches = getBranches();
    const backupBranches = branches.local.filter((b) => b.name.startsWith('backup/'));

    if (backupBranches.length === 0) {
      ui.warn('No backup branches found');
      return;
    }

    const options = backupBranches.map((branch) => ({
      value: branch.name,
      label: branch.name,
      hint: branch.current ? 'current' : '',
    }));

    backupBranch = await ui.prompt.select({
      message: 'Select backup branch to restore:',
      options,
    });

    if (backupBranch === null) return;
  }

  // Verify backup branch exists
  const branches = getBranches();
  const backupExists = branches.local.some((b) => b.name === backupBranch);

  if (!backupExists) {
    ui.error(`Backup branch "${backupBranch}" not found`, { exit: true });
  }

  // Get current branch
  const currentBranch = branches.local.find((b) => b.current)?.name;

  // Confirm restore
  const confirm = await ui.prompt.confirm({
    message: `Restore from backup branch "${backupBranch}"?`,
    initialValue: false,
  });

  if (!confirm) {
    return;
  }

  // Checkout backup branch
  await execGitWithSpinner(`checkout ${backupBranch}`, {
    spinnerText: `Checking out backup branch ${backupBranch}`,
    successMessage: `Restored from backup branch ${backupBranch}`,
    errorMessage: 'Failed to restore from backup',
  });

  // Optionally create a new branch from backup
  if (currentBranch && process.stdin.isTTY) {
    const createNew = await ui.prompt.confirm({
      message: `Create new branch "${currentBranch}-restored" from backup?`,
      initialValue: false,
    });

    if (createNew) {
      await execGitWithSpinner(`checkout -b ${currentBranch}-restored`, {
        spinnerText: `Creating branch ${currentBranch}-restored`,
        successMessage: `Branch ${currentBranch}-restored created from backup`,
        errorMessage: 'Failed to create branch',
      });
    }
  }
};
