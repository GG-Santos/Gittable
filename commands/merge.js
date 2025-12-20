const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getBranches, getCurrentBranch } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');

module.exports = async (args) => {
  showBanner('MERGE');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Merge Branch')}`);

  const currentBranch = getCurrentBranch();
  const branches = getBranches();

  let branchToMerge = args[0];

  if (!branchToMerge) {
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

    if (clack.isCancel(branchToMerge)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const strategy = args.includes('--no-ff')
    ? '--no-ff'
    : args.includes('--squash')
      ? '--squash'
      : '';

  const spinner = clack.spinner();
  spinner.start(`Merging ${branchToMerge} into ${currentBranch}`);

  const command = strategy ? `merge ${strategy} ${branchToMerge}` : `merge ${branchToMerge}`;
  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Merged ${branchToMerge} into ${currentBranch}`));
  } else {
    clack.cancel(chalk.red('Merge failed'));
    console.error(result.error);
    console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
    process.exit(1);
  }
};
