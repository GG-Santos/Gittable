const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getStatus } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');

module.exports = async (args) => {
  showBanner('RESTORE');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Restore Files')}`);

  const staged = args.includes('--staged') || args.includes('--cached');
  const source = args.find((arg) => arg.startsWith('--source='))?.split('=')[1];
  const files = args.filter((arg) => !arg.startsWith('--'));

  if (files.length === 0) {
    // Check if TTY is available for interactive prompts
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Available options:'));
      console.log(chalk.gray('  - gittable restore <file1> <file2> ...'));
      console.log(chalk.gray('  - gittable restore --staged <file1> <file2> ...'));
      process.exit(1);
    }

    // Interactive mode: show files that can be restored
    const status = getStatus();
    if (!status) {
      clack.cancel(chalk.red('Failed to get repository status'));
      process.exit(1);
    }

    const availableFiles = staged
      ? status.staged.map((f) => ({ value: f.file, label: chalk.yellow(`M ${f.file}`) }))
      : status.unstaged.map((f) => ({ value: f.file, label: chalk.yellow(`M ${f.file}`) }));

    if (availableFiles.length === 0) {
      clack.cancel(chalk.yellow(`No ${staged ? 'staged' : 'unstaged'} files to restore`));
      return;
    }

    const selected = await clack.multiselect({
      message: chalk.cyan(`Select files to restore${staged ? ' (from staging)' : ''}:`),
      options: availableFiles,
    });

    if (clack.isCancel(selected)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

    files.push(...selected);
  }

  const spinner = clack.spinner();
  spinner.start(`Restoring ${files.length} file(s)`);

  let command = 'restore';
  if (staged) {
    command += ' --staged';
  }
  if (source) {
    command += ` --source=${source}`;
  }
  command += ` -- ${files.join(' ')}`;

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Restored ${files.length} file(s)`));
  } else {
    clack.cancel(chalk.red('Failed to restore files'));
    console.error(result.error);
    process.exit(1);
  }
};
