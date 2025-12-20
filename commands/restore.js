const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getStatus } = require('../lib/git/exec');
const { showCommandHeader, requireTTY, execGitWithSpinner, handleCancel } = require('../lib/utils/command-helpers');

module.exports = async (args) => {
  showCommandHeader('RESTORE', 'Restore Files');

  const staged = args.includes('--staged') || args.includes('--cached');
  const source = args.find((arg) => arg.startsWith('--source='))?.split('=')[1];
  let files = args.filter((arg) => !arg.startsWith('--'));

  if (files.length === 0) {
    requireTTY([
      'Available options:',
      '  - gittable restore <file1> <file2> ...',
      '  - gittable restore --staged <file1> <file2> ...',
    ]);

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

    if (handleCancel(selected)) return;

    files = selected;
  }

  let command = 'restore';
  if (staged) {
    command += ' --staged';
  }
  if (source) {
    command += ` --source=${source}`;
  }
  command += ` -- ${files.join(' ')}`;

  await execGitWithSpinner(command, {
    spinnerText: `Restoring ${files.length} file(s)`,
    successMessage: `Restored ${files.length} file(s)`,
    errorMessage: 'Failed to restore files',
  });
};
