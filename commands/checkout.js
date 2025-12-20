const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showCommandHeader, execGitWithSpinner } = require('../lib/utils/command-helpers');

module.exports = async (args) => {
  showCommandHeader('CHECKOUT', 'Checkout Files');

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

  let command = 'checkout';
  if (from) {
    command += ` ${from}`;
  }
  command += ` -- ${files.join(' ')}`;

  await execGitWithSpinner(command, {
    spinnerText: `Checking out ${files.length} file(s)`,
    successMessage: `Checked out ${files.length} file(s)`,
    errorMessage: 'Failed to checkout files',
  });
};
