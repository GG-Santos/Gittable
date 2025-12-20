const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { showCommandHeader } = require('../lib/utils/command-helpers');

module.exports = async (args) => {
  showCommandHeader('DIFF', 'Show Changes');

  const staged = args.includes('--staged') || args.includes('--cached');
  const file = args.find((arg) => !arg.startsWith('--'));

  let command = 'diff';
  if (staged) {
    command += ' --staged';
  }
  if (file) {
    command += ` ${file}`;
  }

  const result = execGit(command, { silent: false });

  if (!result.success) {
    clack.cancel(chalk.red('Failed to show diff'));
    console.error(result.error);
    process.exit(1);
  }

  clack.outro(chalk.green.bold('Done'));
};
