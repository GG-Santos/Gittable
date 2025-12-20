const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');

module.exports = async (args) => {
  showBanner('CHERRY-PICK');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Cherry-pick Commit')}`);

  let commit = args[0];
  const noCommit = args.includes('--no-commit') || args.includes('-n');
  const continuePick = args.includes('--continue');
  const abortPick = args.includes('--abort');

  if (continuePick) {
    const spinner = clack.spinner();
    spinner.start('Continuing cherry-pick');
    const result = execGit('cherry-pick --continue', { silent: false });
    spinner.stop();

    if (result.success) {
      clack.outro(chalk.green.bold('Cherry-pick continued'));
    } else {
      clack.cancel(chalk.red('Cherry-pick continue failed'));
      console.error(result.error);
      process.exit(1);
    }
    return;
  }

  if (abortPick) {
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive confirmation.'));
      process.exit(1);
    }

    const confirm = await clack.confirm({
      message: chalk.yellow('Abort cherry-pick? This will lose any progress.'),
      initialValue: false,
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

    const spinner = clack.spinner();
    spinner.start('Aborting cherry-pick');
    const result = execGit('cherry-pick --abort', { silent: true });
    spinner.stop();

    if (result.success) {
      clack.outro(chalk.green.bold('Cherry-pick aborted'));
    } else {
      clack.cancel(chalk.red('Failed to abort cherry-pick'));
      console.error(result.error);
      process.exit(1);
    }
    return;
  }

  if (!commit) {
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Please provide a commit hash: gittable cherry-pick <commit>'));
      process.exit(1);
    }

    commit = await clack.text({
      message: chalk.cyan('Commit hash to cherry-pick:'),
      placeholder: 'abc1234',
    });

    if (clack.isCancel(commit)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Cherry-picking commit ${commit}`);

  let command = 'cherry-pick';
  if (noCommit) {
    command += ' --no-commit';
  }
  command += ` ${commit}`;

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Cherry-picked commit ${commit}`));
  } else {
    clack.cancel(chalk.red('Cherry-pick failed'));
    console.error(result.error);
    console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
    console.log(chalk.gray('Use "gittable cherry-pick --continue" to continue after resolving'));
    console.log(chalk.gray('Use "gittable cherry-pick --abort" to abort'));
    process.exit(1);
  }
};
