const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getCurrentBranch, getStatus } = require('../../core/git');
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
 * Quick command - Add + Commit + Push
 * The most common workflow: stage → commit → push
 */
module.exports = async (args) => {
  showCommandHeader('QUICK', 'Quick Workflow (Add + Commit + Push)');

  requireTTY('This command requires interactive input');

  const branch = getCurrentBranch();
  const remote =
    args.find((arg) => !arg.startsWith('-') && arg !== '--all' && arg !== '-a') || 'origin';
  const force = args.includes('--force') || args.includes('-f');
  const stageAll = args.includes('--all') || args.includes('-a');

  // Validate branch exists
  const branchName = getValidBranch(branch, 'pushing');

  // Ensure remote exists
  await ensureRemoteExists(remote);

  // Check if there are any changes
  const status = getStatus();
  if (!status) {
    clack.cancel(chalk.red('Failed to get repository status'));
    process.exit(1);
  }

  const hasChanges =
    status.staged.length > 0 || status.unstaged.length > 0 || status.untracked.length > 0;

  if (!hasChanges) {
    clack.cancel(chalk.yellow('No changes to commit'));
    return;
  }

  // Show summary
  const changeCount = status.staged.length + status.unstaged.length + status.untracked.length;
  clack.note(`${changeCount} file(s) with changes`, chalk.dim('Changes detected'));

  // Step 1: Stage files
  if (stageAll) {
    const confirmed = await promptConfirm('Stage all changes?', true);
    if (!confirmed) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

    await execGitWithSpinner('add -A', {
      spinnerText: 'Staging all changes',
      successMessage: null,
      errorMessage: 'Failed to stage files',
    });
  } else {
    // Check if there are unstaged files
    const unstagedCount = status.unstaged.length + status.untracked.length;
    if (unstagedCount > 0) {
      const shouldStage = await promptConfirm(`Stage ${unstagedCount} unstaged file(s)?`, true);
      if (shouldStage) {
        await execGitWithSpinner('add -A', {
          spinnerText: 'Staging changes',
          successMessage: null,
          errorMessage: 'Failed to stage files',
        });
      }
    }
  }

  // Step 2: Commit
  const commitOptions = {
    showHeader: false,
    showStagedFiles: true,
    all: false, // Already staged above
    allowEmpty: args.includes('--allow-empty'),
    amend: args.includes('--amend'),
    noVerify: args.includes('--no-verify'),
    noGpgSign: args.includes('--no-gpg-sign'),
  };

  let commitResult;
  try {
    commitResult = await commitFlow(commitOptions);

    if (commitResult.cancelled) {
      return;
    }

    if (!commitResult.success) {
      clack.cancel(chalk.red('Commit failed, skipping push'));
      process.exit(1);
    }
  } catch (error) {
    clack.cancel(chalk.red('Commit failed'));
    console.error(error.message);
    process.exit(1);
  }

  // Step 3: Push
  const shouldPush = await promptConfirm(`Push to ${remote}/${branchName}?`, true);

  if (!shouldPush) {
    clack.outro(chalk.green('Commit created successfully (push cancelled)'));
    return;
  }

  if (force) {
    const confirmed = await promptConfirm('Force push? This can overwrite remote history.', false);
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
    successMessage: 'Quick workflow completed',
    errorMessage: 'Push failed',
  });
};
