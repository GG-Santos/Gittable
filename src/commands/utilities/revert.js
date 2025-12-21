const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getLog } = require('../../core/git');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  showBanner('REVERT');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Revert Commit')}`);

  let commit = args[0];
  const noCommit = args.includes('--no-commit') || args.includes('-n');

  if (!commit) {
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Please provide a commit hash: gittable revert <commit>'));
      process.exit(1);
    }

    const commits = getLog(10, '%h|%s');
    if (commits.length === 0) {
      clack.cancel(chalk.yellow('No commits found'));
      return;
    }

    const options = commits.map((c) => ({
      value: c.hash,
      label: `${c.hash} - ${c.message}`,
    }));

    const theme = getTheme();
    commit = await clack.select({
      message: theme.primary('Select commit to revert:'),
      options,
    });

    if (clack.isCancel(commit)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Reverting commit ${commit}`);

  let command = 'revert';
  if (noCommit) {
    command += ' --no-commit';
  }
  command += ` ${commit}`;

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Reverted commit ${commit}`));
  } else {
    clack.cancel(chalk.red('Revert failed'));
    console.error(result.error);
    console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
    process.exit(1);
  }
};
