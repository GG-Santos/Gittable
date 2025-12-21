const { showCommandHeader, execGitWithSpinner } = require('../../utils/command-helpers');
const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');

/**
 * Merge-continue command - Continue merge after resolving conflicts
 */
module.exports = async (_args) => {
  showCommandHeader('MERGE-CONTINUE', 'Continue Merge');

  // Check if we're in a merge state
  const mergeHead = execGit('rev-parse --verify MERGE_HEAD', { silent: true });
  if (!mergeHead.success) {
    clack.cancel(chalk.yellow('Not in a merge state'));
    return;
  }

  // Check if there are unresolved conflicts
  const conflicts = execGit('diff --name-only --diff-filter=U', { silent: true });
  if (conflicts.success && conflicts.output.trim().length > 0) {
    const conflictedFiles = conflicts.output.trim().split('\n').filter(Boolean);
    clack.cancel(
      chalk.red(`Cannot continue: ${conflictedFiles.length} file(s) still have conflicts`)
    );
    console.log();
    console.log(chalk.yellow('Resolve conflicts first:'));
    console.log(chalk.cyan('  gittable conflicts'));
    console.log(chalk.cyan('  gittable resolve <file>'));
    console.log();
    process.exit(1);
  }

  await execGitWithSpinner('merge --continue', {
    spinnerText: 'Continuing merge',
    successMessage: 'Merge completed',
    errorMessage: 'Failed to continue merge',
  });
};
