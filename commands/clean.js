const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getStatus } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');

module.exports = async (args) => {
  showBanner('CLEAN');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Clean Untracked Files')}`);

  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const force = args.includes('--force') || args.includes('-f');
  const directories = args.includes('--dir') || args.includes('-d');
  const interactive = args.includes('--interactive') || args.includes('-i');

  const status = getStatus();
  if (!status) {
    clack.cancel(chalk.red('Failed to get repository status'));
    process.exit(1);
  }

  if (status.untracked.length === 0) {
    clack.cancel(chalk.yellow('No untracked files to clean'));
    return;
  }

  if (dryRun) {
    console.log(chalk.yellow('\nFiles that would be removed:'));
    for (const file of status.untracked) {
      console.log(chalk.gray(`  ${file}`));
    }
    clack.outro(chalk.green.bold('Dry run complete'));
    return;
  }

  if (!force && !interactive) {
    const confirm = await clack.confirm({
      message: chalk.yellow(`Remove ${status.untracked.length} untracked file(s)?`),
      initialValue: false,
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start('Cleaning untracked files');

  let command = 'clean';
  if (force) {
    command += ' -f';
  }
  if (directories) {
    command += ' -d';
  }
  if (interactive) {
    command += ' -i';
  }

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Clean completed'));
  } else {
    clack.cancel(chalk.red('Clean failed'));
    console.error(result.error);
    process.exit(1);
  }
};
