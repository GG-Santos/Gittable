const { getCurrentBranch } = require('../../core/git');
const { showCommandHeader, execGitWithSpinner } = require('../../utils/commands');
const { ensureRemoteExists, getValidBranch } = require('../../utils/git');
const chalk = require('chalk');

module.exports = async (args) => {
  showCommandHeader('SYNC', 'Synchronize Repository');

  const branch = getCurrentBranch();
  const remote = args[0] || 'origin';

  // Validate branch exists
  const validBranch = getValidBranch(branch, 'synchronizing');

  // Ensure remote exists (prompts to add if missing)
  await ensureRemoteExists(remote);

  // Step 1: Fetch
  await execGitWithSpinner(`fetch ${remote}`, {
    spinnerText: 'Fetching from remote',
    successMessage: null, // Don't show success for intermediate step
    errorMessage: 'Fetch failed',
    onSuccess: () => {}, // Silent success
  });

  // Step 2: Rebase
  await execGitWithSpinner(`rebase ${remote}/${validBranch}`, {
    spinnerText: `Rebasing onto ${remote}/${validBranch}`,
    successMessage: null, // Don't show success for intermediate step
    errorMessage: 'Rebase failed',
    onError: () => {
      console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
    },
  });

  // Step 3: Push
  await execGitWithSpinner(`push ${remote} ${validBranch}`, {
    spinnerText: `Pushing to ${remote}/${validBranch}`,
    successMessage: 'Synchronization completed',
    errorMessage: 'Push failed',
  });
};
