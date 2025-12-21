const { execGit, getCurrentBranch } = require('../core/git');
const clack = require('@clack/prompts');
const chalk = require('chalk');

/**
 * Create a backup branch before destructive operations
 */
function createBackupBranch(operation = 'operation') {
  const currentBranch = getCurrentBranch();
  if (!currentBranch) {
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupName = `backup/${currentBranch}-${operation}-${timestamp}`;

  const result = execGit(`branch ${backupName}`, { silent: true });

  if (result.success) {
    return backupName;
  }

  return null;
}

/**
 * Save commit hash before reset
 */
function saveCommitHash() {
  const result = execGit('rev-parse HEAD', { silent: true });
  if (result.success) {
    return result.output.trim();
  }
  return null;
}

/**
 * Offer to restore from backup
 */
async function offerRestore(backupBranch, originalBranch) {
  const { promptConfirm } = require('./command-helpers');

  const restore = await promptConfirm(`Restore from backup branch "${backupBranch}"?`, false);

  if (restore) {
    const { execGitWithSpinner } = require('./command-helpers');
    await execGitWithSpinner(`checkout ${backupBranch}`, {
      spinnerText: 'Restoring from backup',
      successMessage: `Restored from backup branch ${backupBranch}`,
      errorMessage: 'Failed to restore from backup',
    });
    return true;
  }

  return false;
}

module.exports = {
  createBackupBranch,
  saveCommitHash,
  offerRestore,
};
