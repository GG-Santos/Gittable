const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');

module.exports = async (args) => {
  showBanner('RM');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Remove Files')}`);

  const files = args.filter((arg) => !arg.startsWith('--'));
  const cached = args.includes('--cached') || args.includes('--staged');
  const force = args.includes('--force') || args.includes('-f');
  const recursive = args.includes('--recursive') || args.includes('-r');

  if (files.length === 0) {
    clack.cancel(chalk.yellow('No files specified'));
    return;
  }

  if (!force) {
    const confirm = await clack.confirm({
      message: chalk.yellow(`Remove ${files.length} file(s) from git?`),
      initialValue: false,
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Removing ${files.length} file(s)`);

  let command = 'rm';
  if (cached) {
    command += ' --cached';
  }
  if (force) {
    command += ' --force';
  }
  if (recursive) {
    command += ' --recursive';
  }
  command += ` ${files.join(' ')}`;

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Removed ${files.length} file(s)`));
  } else {
    clack.cancel(chalk.red('Failed to remove files'));
    console.error(result.error);
    process.exit(1);
  }
};
