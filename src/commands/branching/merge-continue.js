const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showCommandHeader, execGitWithSpinner } = require('../../utils/command-helpers');
const { execGit } = require('../../core/git');

/**
 * Merge-continue command - Continue merge after resolving conflicts
 */
module.exports = async (_args) => {
  showCommandHeader('MERGE-CONTINUE', 'Continue Merge');

  // Check if we're in a merge state
  const mergeHead = execGit('rev-parse --verify MERGE_HEAD', { silent: true });
  if (!mergeHead.success) {
    ui.warn('Not in a merge state');
    return;
  }

  // Check if there are unresolved conflicts
  const conflicts = execGit('diff --name-only --diff-filter=U', { silent: true });
  if (conflicts.success && conflicts.output.trim().length > 0) {
    const conflictedFiles = conflicts.output.trim().split('\n').filter(Boolean);
    ui.error(`Cannot continue: ${conflictedFiles.length} file(s) still have conflicts`, {
      suggestion: 'Resolve conflicts first',
    });
    ui.info('Resolve conflicts first:');
    const theme = require('../../utils/color-theme').getTheme();
    console.log(theme.primary('  gittable conflicts'));
    console.log(theme.primary('  gittable resolve <file>'));
    process.exit(1);
  }

  await execGitWithSpinner('merge --continue', {
    spinnerText: 'Continuing merge',
    successMessage: 'Merge completed',
    errorMessage: 'Failed to continue merge',
  });
};
