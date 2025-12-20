const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');

module.exports = async (args) => {
  showBanner('CHECKOUT');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Checkout Files')}`);

  const files = args.filter((arg) => !arg.startsWith('--'));
  const from =
    args.find((arg) => arg.startsWith('--source='))?.split('=')[1] ||
    args.find((arg) => arg.startsWith('--ours'))
      ? '--ours'
      : args.find((arg) => arg.startsWith('--theirs'))
        ? '--theirs'
        : null;

  if (files.length === 0) {
    clack.cancel(chalk.yellow('No files specified'));
    return;
  }

  const spinner = clack.spinner();
  spinner.start(`Checking out ${files.length} file(s)`);

  let command = 'checkout';
  if (from) {
    command += ` ${from}`;
  }
  command += ` -- ${files.join(' ')}`;

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Checked out ${files.length} file(s)`));
  } else {
    clack.cancel(chalk.red('Failed to checkout files'));
    console.error(result.error);
    process.exit(1);
  }
};
