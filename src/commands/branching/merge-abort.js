const ui = require('../../ui/framework');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
} = require('../../utils/command-helpers');
const { execGit } = require('../../core/git');

/**
 * Merge-abort command - Abort merge
 */
module.exports = async (_args) => {
  showCommandHeader('MERGE-ABORT', 'Abort Merge');

  requireTTY('Please use: git merge --abort for non-interactive mode');

  // Check if we're in a merge state
  const mergeHead = execGit('rev-parse --verify MERGE_HEAD', { silent: true });
  if (!mergeHead.success) {
    ui.warn('Not in a merge state');
    return;
  }

  const confirmed = await promptConfirm(
    'Abort merge? This will cancel the merge operation.',
    false
  );

  if (!confirmed) {
    return;
  }

  await execGitWithSpinner('merge --abort', {
    spinnerText: 'Aborting merge',
    successMessage: 'Merge aborted',
    errorMessage: 'Failed to abort merge',
  });
};
