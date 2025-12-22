const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getBranches, getCurrentBranch, execGit } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
} = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');

module.exports = async (args) => {
  showCommandHeader('MERGE', 'Merge Branch');

  const currentBranch = getCurrentBranch();
  const branches = getBranches();

  let branchToMerge = args[0];

  if (!branchToMerge) {
    requireTTY(['Please provide a branch name:', '  gittable merge <branch-name>']);

    const options = branches.local
      .filter((branch) => !branch.current)
      .map((branch) => ({
        value: branch.name,
        label: branch.name,
      }));

    if (options.length === 0) {
      ui.warn('No branches to merge');
      return;
    }

    branchToMerge = await ui.prompt.select({
      message: 'Select branch to merge:',
      options,
    });

    if (branchToMerge === null) return;
  }

  const strategy = args.includes('--no-ff')
    ? '--no-ff'
    : args.includes('--squash')
      ? '--squash'
      : '';

  const command = strategy ? `merge ${strategy} ${branchToMerge}` : `merge ${branchToMerge}`;

  await execGitWithSpinner(command, {
    spinnerText: `Merging ${branchToMerge} into ${currentBranch}`,
    successMessage: `Merged ${branchToMerge} into ${currentBranch}`,
    errorMessage: 'Merge failed',
    onError: async (errorResult) => {
      // Check if merge conflict occurred
      const conflictCheck = execGit('diff --name-only --diff-filter=U', { silent: true });
      const hasConflicts = conflictCheck.success && conflictCheck.output.trim().length > 0;

      if (hasConflicts && process.stdin.isTTY) {
        ui.warn('Merge conflicts detected');

        const { showSmartSuggestion } = require('../../utils/commands');
        const nextAction = await showSmartSuggestion('What would you like to do?', [
          {
            value: 'resolve',
            label:
              chalk.green('Resolve conflicts') + chalk.dim(' - List and resolve conflicted files'),
          },
          {
            value: 'mergetool',
            label: chalk.cyan('Use mergetool') + chalk.dim(' - Launch merge tool'),
          },
          { value: 'abort', label: chalk.red('Abort merge') + chalk.dim(' - Cancel the merge') },
          { value: 'skip', label: chalk.gray('Skip') },
        ]);

        if (nextAction && nextAction !== 'skip' && nextAction !== 'abort') {
          const router = require('../../cli/router');
          await router.execute(nextAction, []);
        } else if (nextAction === 'abort') {
          const { promptConfirm } = require('../../utils/commands');
          const confirmed = await promptConfirm('Abort merge?', false);
          if (confirmed) {
            await execGitWithSpinner('merge --abort', {
              spinnerText: 'Aborting merge',
              successMessage: 'Merge aborted',
              errorMessage: 'Failed to abort merge',
            });
          }
        }
      } else {
        console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
        console.log(chalk.dim('Use "gittable conflicts" to list conflicted files'));
        console.log(chalk.dim('Use "gittable resolve <file>" to resolve a file'));
        console.log(chalk.dim('Use "gittable merge --continue" to continue after resolving'));
      }
    },
  });
};
