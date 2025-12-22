const chalk = require('chalk');
const ui = require('../../ui/framework');
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
      ui.error('Commit failed, skipping push', { exit: true });
    }

    // Step 2: Ask if user wants to push
    if (skipPush) {
      ui.success('Commit created successfully (push skipped)');
      return;
    }

    const shouldPush = await promptConfirm(`Push to ${remote}/${branchName}?`, true);

    if (!shouldPush) {
      ui.success('Commit created successfully (push cancelled)');
      return;
    }

    // Step 3: Push
    if (force) {
      const confirmed = await promptConfirm(
        'Force push? This can overwrite remote history.',
        false
      );
      if (!confirmed) {
        ui.success('Commit created successfully (push cancelled)');
        return;
      }
    }

    const pushCommand = force
      ? `push ${remote} ${branchName} --force`
      : `push ${remote} ${branchName}`;

    await execGitWithSpinner(pushCommand, {
      spinnerText: `Pushing to ${remote}/${branchName}`,
      successMessage: null, // We'll show success ourselves
      errorMessage: 'Push failed',
      onSuccess: () => {
        ui.success('Commit and push completed');
      },
    });
  } catch (error) {
    ui.error('Operation failed', {
      suggestion: error.message,
      exit: true,
    });
  }
};
