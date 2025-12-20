const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');

module.exports = async (args) => {
  showBanner('BLAME');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Blame File')}`);

  const file = args[0];
  const revision = args.find((arg) => !arg.startsWith('--'));

  if (!file) {
    clack.cancel(chalk.yellow('No file specified'));
    return;
  }

  let command = 'blame';
  if (revision && revision !== file) {
    command += ` ${revision}`;
  }
  command += ` ${file}`;

  const result = execGit(command, { silent: false });

  if (!result.success) {
    clack.cancel(chalk.red('Failed to show blame'));
    console.error(result.error);
    process.exit(1);
  }

  clack.outro(chalk.green.bold('Done'));
};
