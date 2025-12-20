const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getBranches, getCurrentBranch } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');

module.exports = async (args) => {
  showBanner('REBASE');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Rebase')}`);

  const currentBranch = getCurrentBranch();
  const branches = getBranches();

  let targetBranch = args[0];

  if (!targetBranch) {
    // Check if TTY is available for interactive prompts
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Please provide a branch name: gittable rebase <branch>'));
      process.exit(1);
    }

    const options = branches.local
      .filter((branch) => !branch.current)
      .map((branch) => ({
        value: branch.name,
        label: branch.name,
      }));

    // Add remote branches option
    options.push({
      value: '__remote__',
      label: chalk.dim('Remote branch...'),
    });

    if (options.length === 0) {
      clack.cancel(chalk.yellow('No branches to rebase onto'));
      return;
    }

    targetBranch = await clack.select({
      message: chalk.cyan('Select branch to rebase onto:'),
      options,
    });

    if (clack.isCancel(targetBranch)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

    if (targetBranch === '__remote__') {
      targetBranch = await clack.text({
        message: chalk.cyan('Remote branch (e.g., origin/main):'),
        placeholder: 'origin/main',
      });

      if (clack.isCancel(targetBranch)) {
        clack.cancel(chalk.yellow('Cancelled'));
        return;
      }
    }
  }

  const interactive = args.includes('--interactive') || args.includes('-i');
  const continueRebase = args.includes('--continue');
  const abortRebase = args.includes('--abort');

  if (continueRebase) {
    const spinner = clack.spinner();
    spinner.start('Continuing rebase');
    const result = execGit('rebase --continue', { silent: false });
    spinner.stop();

    if (result.success) {
      clack.outro(chalk.green.bold('Rebase continued'));
    } else {
      clack.cancel(chalk.red('Rebase continue failed'));
      console.error(result.error);
      process.exit(1);
    }
    return;
  }

  if (abortRebase) {
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive confirmation.'));
      process.exit(1);
    }

    const confirm = await clack.confirm({
      message: chalk.yellow('Abort rebase? This will lose any rebase progress.'),
      initialValue: false,
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

    const spinner = clack.spinner();
    spinner.start('Aborting rebase');
    const result = execGit('rebase --abort', { silent: true });
    spinner.stop();

    if (result.success) {
      clack.outro(chalk.green.bold('Rebase aborted'));
    } else {
      clack.cancel(chalk.red('Failed to abort rebase'));
      console.error(result.error);
      process.exit(1);
    }
    return;
  }

  const spinner = clack.spinner();
  spinner.start(`Rebasing ${currentBranch} onto ${targetBranch}`);

  const command = interactive ? `rebase --interactive ${targetBranch}` : `rebase ${targetBranch}`;
  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Rebase completed'));
  } else {
    clack.cancel(chalk.red('Rebase failed'));
    console.error(result.error);
    console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
    console.log(chalk.gray('Use "gittable rebase --continue" to continue after resolving'));
    console.log(chalk.gray('Use "gittable rebase --abort" to abort the rebase'));
    process.exit(1);
  }
};
