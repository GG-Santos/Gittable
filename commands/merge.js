const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getBranches, getCurrentBranch } = require('../lib/git/exec');
const { showCommandHeader, requireTTY, execGitWithSpinner, handleCancel } = require('../lib/utils/command-helpers');

module.exports = async (args) => {
  showCommandHeader('MERGE', 'Merge Branch');

  const currentBranch = getCurrentBranch();
  const branches = getBranches();

  let branchToMerge = args[0];

  if (!branchToMerge) {
    requireTTY([
      'Please provide a branch name:',
      '  gittable merge <branch-name>',
    ]);

    const options = branches.local
      .filter((branch) => !branch.current)
      .map((branch) => ({
        value: branch.name,
        label: branch.name,
      }));

    if (options.length === 0) {
      clack.cancel(chalk.yellow('No branches to merge'));
      return;
    }

    branchToMerge = await clack.select({
      message: chalk.cyan('Select branch to merge:'),
      options,
    });

    if (handleCancel(branchToMerge)) return;
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
    onError: () => {
      console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
    },
  });
};
