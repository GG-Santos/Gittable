const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getCurrentBranch } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
} = require('../../utils/command-helpers');
const { ensureRemoteExists } = require('../../utils/remote-helpers');
const { getValidBranch } = require('../../utils/branch-helpers');

module.exports = async (args) => {
  showCommandHeader('PUSH', 'Push to Remote');

  const branch = getCurrentBranch();
  const remote = args[0] || 'origin';
  let branchName = args[1] || branch;
  const force = args.includes('--force') || args.includes('-f');

  // Validate branch exists
  branchName = getValidBranch(branchName, 'pushing');

  // Ensure remote exists (prompts to add if missing)
  await ensureRemoteExists(remote);

  // Check branch protection
  const { checkBranchProtection } = require('../../utils/branch-protection');
  const protection = checkBranchProtection(branchName, force ? 'force' : 'push');

  if (protection.isProtected) {
    console.log();
    console.log(chalk.yellow.bold(`⚠ Warning: ${protection.warning}`));
    console.log(chalk.yellow(protection.message));
    if (protection.suggestion) {
      console.log(chalk.cyan(protection.suggestion));
    }
    console.log();

    const { promptConfirm } = require('../../utils/command-helpers');
    const proceed = await promptConfirm('Proceed anyway?', false);
    if (!proceed) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  // Handle force push confirmation
  if (force) {
    requireTTY([
      'Force push requires confirmation.',
      'Please use: gittable push <remote> <branch> --force (with confirmation)',
    ]);

    const confirmed = await promptConfirm('Force push? This can overwrite remote history.', false);
    if (!confirmed) return;
  }

  // Execute push with spinner
  const command = force ? `push ${remote} ${branchName} --force` : `push ${remote} ${branchName}`;

  const result = await execGitWithSpinner(command, {
    spinnerText: `Pushing to ${remote}/${branchName}`,
    successMessage: 'Push completed',
    errorMessage: 'Push failed',
    onSuccess: async () => {
      // Suggest creating PR after successful push
      if (process.stdin.isTTY && branchName !== 'main' && branchName !== 'master') {
        const { getPRUrl, detectCIPlatform } = require('../../utils/ci-status');
        const platform = detectCIPlatform();
        if (platform) {
          const { showSmartSuggestion } = require('../../utils/command-helpers');
          const nextAction = await showSmartSuggestion(
            'Push successful. What would you like to do next?',
            [
              {
                value: 'create-pr',
                label: chalk.cyan('Create PR') + chalk.dim(' - Open PR creation page'),
              },
              { value: 'skip', label: chalk.gray('Skip') },
            ]
          );

          if (nextAction && nextAction !== 'skip') {
            const router = require('../../cli/router');
            await router.execute(nextAction, []);
          }
        }
      }
    },
    onError: async (errorResult) => {
      // Smart suggestion: offer to pull if push fails due to being behind
      if (errorResult.error?.includes('Updates were rejected')) {
        const { showSmartSuggestion } = require('../../utils/command-helpers');
        if (process.stdin.isTTY) {
          const nextAction = await showSmartSuggestion(
            'Push failed. Your branch may be behind. What would you like to do?',
            [
              {
                value: 'pull',
                label: chalk.green('Pull') + chalk.dim(' - Pull and merge changes'),
              },
              {
                value: 'pull-rebase',
                label: chalk.cyan('Pull & Rebase') + chalk.dim(' - Pull and rebase'),
              },
              {
                value: 'sync',
                label: chalk.cyan('Sync') + chalk.dim(' - Fetch, rebase, and push'),
              },
              { value: 'skip', label: chalk.gray('Skip') },
            ]
          );

          if (nextAction && nextAction !== 'skip') {
            const router = require('../../cli/router');
            await router.execute(nextAction, remote ? [remote] : []);
          }
        }
      }
    },
  });

  return result;
};
