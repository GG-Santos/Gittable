const { getCurrentBranch } = require('../../core/git');
const { showCommandHeader, execGitWithSpinner } = require('../../utils/command-helpers');
const { ensureRemoteExists } = require('../../utils/remote-helpers');
const { getValidBranch } = require('../../utils/branch-helpers');
const chalk = require('chalk');

/**
 * Pull + Rebase command
 * Fetches and rebases without pushing (safer than sync)
 */
module.exports = async (args) => {
  showCommandHeader('PULL-REBASE', 'Pull and Rebase');

  const branch = getCurrentBranch();
  const remote = args[0] || 'origin';

  // Validate branch exists
  const validBranch = getValidBranch(branch, 'rebasing');

  // Ensure remote exists
  await ensureRemoteExists(remote);

  // Step 1: Fetch
  await execGitWithSpinner(`fetch ${remote}`, {
    spinnerText: 'Fetching from remote',
    successMessage: null,
    errorMessage: 'Fetch failed',
  });

  // Step 2: Rebase
  await execGitWithSpinner(`rebase ${remote}/${validBranch}`, {
    spinnerText: `Rebasing onto ${remote}/${validBranch}`,
    successMessage: 'Pull and rebase completed',
    errorMessage: 'Rebase failed',
    onError: () => {
      console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
    },
  });
};
