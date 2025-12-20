const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');

module.exports = async (args) => {
  showBanner('MV');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Move/Rename Files')}`);

  const force = args.includes('--force') || args.includes('-f');
  const files = args.filter((arg) => !arg.startsWith('--'));

  if (files.length < 2) {
    clack.cancel(chalk.yellow('Usage: mv <source> <destination>'));
    return;
  }

  const source = files[0];
  const destination = files[1];

  const spinner = clack.spinner();
  spinner.start(`Moving ${source} to ${destination}`);

  let command = 'mv';
  if (force) {
    command += ' --force';
  }
  command += ` ${source} ${destination}`;

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Moved ${source} to ${destination}`));
  } else {
    clack.cancel(chalk.red('Failed to move file'));
    console.error(result.error);
    process.exit(1);
  }
};
