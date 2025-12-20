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
    // Check if TTY is available for interactive prompts
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Please provide a branch name:'));
      console.log(chalk.gray('  gittable merge <branch-name>'));
      process.exit(1);
    }

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
