const { getCurrentBranch } = require('../../core/git');
const { showCommandHeader, execGitWithSpinner, requireTTY } = require('../../utils/commands');
const { ensureRemoteExists, getValidBranch } = require('../../utils/git');
const chalk = require('chalk');
const prompts = require('../../ui/prompts');

module.exports = async (args) => {
  showCommandHeader('PULL', 'Pull from Remote');

  const branch = getCurrentBranch();
  const remote = args[0] || 'origin';
  let branchName = args[1] || branch;
  const useRebase = args.includes('--rebase') || args.includes('-r');

  // Validate branch exists
  branchName = getValidBranch(branchName, 'pulling');

  // Ensure remote exists (prompts to add if missing)
  await ensureRemoteExists(remote);

  // If rebase option is not specified, ask user if they want to rebase
  if (!useRebase && process.stdin.isTTY) {
    const action = await prompts.select({
      message: 'How would you like to pull?',
      options: [
        { value: 'merge', label: chalk.green('Merge') + chalk.dim(' - Merge remote changes (default)') },
        { value: 'rebase', label: chalk.cyan('Rebase') + chalk.dim(' - Rebase local changes on top') },
      ],
    });

    if (prompts.isCancel(action)) {
      prompts.cancel(chalk.yellow('Cancelled'));
      return;
    }

    if (action === 'rebase') {
      // Use rebase flow
      await execGitWithSpinner(`fetch ${remote}`, {
        spinnerText: 'Fetching from remote',
        successMessage: null,
        errorMessage: 'Fetch failed',
      });

      await execGitWithSpinner(`rebase ${remote}/${branchName}`, {
        spinnerText: `Rebasing onto ${remote}/${branchName}`,
        successMessage: 'Pull and rebase completed',
        errorMessage: 'Rebase failed',
        onError: () => {
          console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
        },
      });
      return;
    }
  }

  // Default: merge pull
  if (useRebase) {
    // Rebase flow
    await execGitWithSpinner(`fetch ${remote}`, {
      spinnerText: 'Fetching from remote',
      successMessage: null,
      errorMessage: 'Fetch failed',
    });

    await execGitWithSpinner(`rebase ${remote}/${branchName}`, {
      spinnerText: `Rebasing onto ${remote}/${branchName}`,
      successMessage: 'Pull and rebase completed',
      errorMessage: 'Rebase failed',
      onError: () => {
        console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
      },
    });
  } else {
    // Merge pull
    await execGitWithSpinner(`pull ${remote} ${branchName}`, {
      spinnerText: `Pulling from ${remote}/${branchName}`,
      successMessage: 'Pull completed',
      errorMessage: 'Pull failed',
    });
  }
};
