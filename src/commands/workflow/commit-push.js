const { getCurrentBranch } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
} = require('../../utils/command-helpers');
const { ensureRemoteExists } = require('../../utils/remote-helpers');
const { getValidBranch } = require('../../utils/branch-helpers');
const { commitFlow } = require('../../core/commit/flow');
const clack = require('@clack/prompts');
const chalk = require('chalk');

/**
 * Commit + Push command
 * Commits changes and then pushes to remote
 */
module.exports = async (args) => {
  showCommandHeader('COMMIT-PUSH', 'Commit and Push');

  requireTTY('Please use: git commit -m "message" && git push for non-interactive commits');

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
  const force = args.includes('--force') || args.includes('-f');
  const skipPush = args.includes('--no-push');

  // Validate branch exists
  const branchName = getValidBranch(branch, 'pushing');

  // Ensure remote exists
  await ensureRemoteExists(remote);

  try {
    // Step 1: Commit
    const commitResult = await commitFlow(commitOptions);

    if (commitResult.cancelled) {
      return;
    }

    if (!commitResult.success) {
      clack.cancel(chalk.red('Commit failed, skipping push'));
      process.exit(1);
    }

    // Step 2: Ask if user wants to push
    if (skipPush) {
      clack.outro(chalk.green('Commit created successfully (push skipped)'));
      return;
    }

    const shouldPush = await promptConfirm(`Push to ${remote}/${branchName}?`, true);

    if (!shouldPush) {
      clack.outro(chalk.green('Commit created successfully (push cancelled)'));
      return;
    }

    // Step 3: Push
    if (force) {
      const confirmed = await promptConfirm(
        'Force push? This can overwrite remote history.',
        false
      );
      if (!confirmed) {
        clack.outro(chalk.green('Commit created successfully (push cancelled)'));
        return;
      }
    }

    const pushCommand = force
      ? `push ${remote} ${branchName} --force`
      : `push ${remote} ${branchName}`;

    await execGitWithSpinner(pushCommand, {
      spinnerText: `Pushing to ${remote}/${branchName}`,
      successMessage: 'Commit and push completed',
      errorMessage: 'Push failed',
    });
  } catch (error) {
    clack.cancel(chalk.red('Operation failed'));
    console.error(error.message);
    process.exit(1);
  }
};
