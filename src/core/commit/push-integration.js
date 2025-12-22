/**
 * Push and sync integration module
 * Handles push/sync flow after successful commit
 */

const prompts = require('../../ui/prompts');
const chalk = require('chalk');
const { getTheme } = require('../../utils/ui');

/**
 * Handle push/sync flow after successful commit
 */
async function handlePushIntegration(options = {}) {
  if (!process.stdin.isTTY || options.skipPushSuggestion) {
    return;
  }

  const { getCurrentBranch } = require('../git');
  const { ensureRemoteExists, getValidBranch } = require('../../utils/git');
  const { execGitWithSpinner, promptConfirm } = require('../../utils/commands');
  const ui = require('../../ui/framework');
  const theme = getTheme();

  const branch = getCurrentBranch();
  const branchName = getValidBranch(branch, 'pushing');
  
  // Check if remote exists
  const { DEFAULT_REMOTE } = require('../constants');
  let remote = DEFAULT_REMOTE;
  try {
    await ensureRemoteExists(remote);
  } catch (error) {
    // If remote doesn't exist, skip push options
    return;
  }

  const nextAction = await prompts.select({
    message: 'Commit created successfully. What would you like to do next?',
    options: [
      { value: 'push', label: chalk.green('Push') + chalk.dim(` - Push to ${remote}/${branchName}`) },
      { value: 'sync', label: theme.primary('Sync') + chalk.dim(' - Fetch, rebase, and push') },
      { value: 'skip', label: chalk.gray('Skip') + chalk.dim(' - Do nothing') },
    ],
  });

  if (prompts.isCancel(nextAction) || nextAction === 'skip') {
    return;
  }

  if (nextAction === 'push') {
    await handlePush(remote, branchName, options);
  } else if (nextAction === 'sync') {
    await handleSync(remote, branchName);
  }
}

/**
 * Handle push operation
 */
async function handlePush(remote, branchName, options = {}) {
  const { execGitWithSpinner, promptConfirm, showSmartSuggestion } = require('../../utils/commands');
  const router = require('../../cli/router');
  const chalk = require('chalk');

  // Check for force push flag in options
  const force = options.force || false;
  
  if (force) {
    const confirmed = await promptConfirm(
      'Force push? This can overwrite remote history.',
      false
    );
    if (!confirmed) {
      return;
    }
  }

  const pushCommand = force
    ? `push ${remote} ${branchName} --force`
    : `push ${remote} ${branchName}`;

  try {
    await execGitWithSpinner(pushCommand, {
      spinnerText: `Pushing to ${remote}/${branchName}`,
      successMessage: 'Push completed successfully',
      errorMessage: 'Push failed',
      onError: async (errorResult) => {
        // Offer to pull/sync if push fails due to being behind
        if (errorResult.error?.includes('Updates were rejected')) {
          const recoveryAction = await showSmartSuggestion(
            'Push failed. Your branch may be behind. What would you like to do?',
            [
              {
                value: 'pull',
                label: chalk.green('Pull') + chalk.dim(' - Pull and merge changes'),
              },
              {
                value: 'sync',
                label: chalk.cyan('Sync') + chalk.dim(' - Fetch, rebase, and push'),
              },
              { value: 'skip', label: chalk.gray('Skip') },
            ]
          );

          if (recoveryAction && recoveryAction !== 'skip') {
            await router.execute(recoveryAction, remote ? [remote] : []);
          }
        }
      },
    });
  } catch (error) {
    // Error already handled in onError callback
  }
}

/**
 * Handle sync operation (fetch, rebase, push)
 */
async function handleSync(remote, branchName) {
  const { execGitWithSpinner } = require('../../utils/commands');
  const ui = require('../../ui/framework');

  try {
    // Step 1: Fetch
    await execGitWithSpinner(`fetch ${remote}`, {
      spinnerText: 'Fetching from remote',
      successMessage: null,
      errorMessage: 'Fetch failed',
    });

    // Step 2: Rebase
    await execGitWithSpinner(`rebase ${remote}/${branchName}`, {
      spinnerText: `Rebasing onto ${remote}/${branchName}`,
      successMessage: null,
      errorMessage: 'Rebase failed',
      onError: () => {
        ui.warn('You may need to resolve conflicts manually');
      },
    });

    // Step 3: Push
    await execGitWithSpinner(`push ${remote} ${branchName}`, {
      spinnerText: `Pushing to ${remote}/${branchName}`,
      successMessage: 'Sync completed successfully',
      errorMessage: 'Push failed',
    });
  } catch (error) {
    // Error already handled in onError callbacks
  }
}

module.exports = {
  handlePushIntegration,
  handlePush,
  handleSync,
};

