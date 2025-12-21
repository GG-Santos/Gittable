const clack = require('@clack/prompts');
const chalk = require('chalk');
const {
  showCommandHeader,
  execGitWithSpinner,
  handleCancel,
} = require('../../utils/command-helpers');
const { execGit, getBranches } = require('../../core/git');
const { getTheme } = require('../../utils/color-theme');

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
      clack.cancel(chalk.yellow('No backup branches found'));
      return;
    }

    const options = backupBranches.map((branch) => ({
      value: branch.name,
      label: branch.name,
      hint: branch.current ? 'current' : '',
    }));

    const theme = getTheme();
    backupBranch = await clack.select({
      message: theme.primary('Select backup branch to restore:'),
      options,
    });

    if (handleCancel(backupBranch)) return;
  }

  // Verify backup branch exists
  const branches = getBranches();
  const backupExists = branches.local.some((b) => b.name === backupBranch);

  if (!backupExists) {
    clack.cancel(chalk.red(`Backup branch "${backupBranch}" not found`));
    return;
  }

  // Get current branch
  const currentBranch = branches.local.find((b) => b.current)?.name;

  // Confirm restore
  const confirm = await clack.confirm({
    message: chalk.yellow(`Restore from backup branch "${backupBranch}"?`),
    initialValue: false,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel(chalk.yellow('Cancelled'));
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
    const theme = getTheme();
    const createNew = await clack.confirm({
      message: theme.primary(`Create new branch "${currentBranch}-restored" from backup?`),
      initialValue: false,
    });

    if (createNew && !clack.isCancel(createNew)) {
      await execGitWithSpinner(`checkout -b ${currentBranch}-restored`, {
        spinnerText: `Creating branch ${currentBranch}-restored`,
        successMessage: `Branch ${currentBranch}-restored created from backup`,
        errorMessage: 'Failed to create branch',
      });
    }
  }
};
