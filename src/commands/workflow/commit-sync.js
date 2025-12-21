const { getCurrentBranch } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
} = require('../../utils/command-helpers');
const { ensureRemoteExists } = require('../../utils/remote-helpers');
const { getValidBranch } = require('../../utils/branch-helpers');
const { commitFlow } = require('../../core/commit/flow');
const clack = require('@clack/prompts');
const chalk = require('chalk');

/**
 * Commit + Sync command
 * Commits changes and then syncs (fetch + rebase + push)
 */
module.exports = async (args) => {
  showCommandHeader('COMMIT-SYNC', 'Commit and Sync');

  requireTTY('Please use: git commit -m "message" && git sync for non-interactive commits');

  // Parse command line arguments
  const commitOptions = {
    showHeader: false,
    showStagedFiles: true,
    all: args.includes('-a') || args.includes('--all'),
    allowEmpty: args.includes('--allow-empty'),
    amend: args.includes('--amend') || args.includes('--no-edit'),
    noVerify: args.includes('--no-verify'),
    noGpgSign: args.includes('--no-gpg-sign'),
  };

  const branch = getCurrentBranch();
  const remote = args.find((arg) => !arg.startsWith('-')) || 'origin';

  // Validate branch exists
  const validBranch = getValidBranch(branch, 'synchronizing');

  // Ensure remote exists
  await ensureRemoteExists(remote);

  try {
    // Step 1: Commit
    const commitResult = await commitFlow(commitOptions);

    if (commitResult.cancelled) {
      return;
    }

    if (!commitResult.success) {
      clack.cancel(chalk.red('Commit failed, skipping sync'));
      process.exit(1);
    }

    // Step 2: Fetch
    await execGitWithSpinner(`fetch ${remote}`, {
      spinnerText: 'Fetching from remote',
      successMessage: null,
      errorMessage: 'Fetch failed',
    });

    // Step 3: Rebase
    await execGitWithSpinner(`rebase ${remote}/${validBranch}`, {
      spinnerText: `Rebasing onto ${remote}/${validBranch}`,
      successMessage: null,
      errorMessage: 'Rebase failed',
      onError: () => {
        console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
      },
    });

    // Step 4: Push
    await execGitWithSpinner(`push ${remote} ${validBranch}`, {
      spinnerText: `Pushing to ${remote}/${validBranch}`,
      successMessage: 'Commit and sync completed',
      errorMessage: 'Push failed',
    });
  } catch (error) {
    clack.cancel(chalk.red('Operation failed'));
    console.error(error.message);
    process.exit(1);
  }
};
