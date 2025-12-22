const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getStatus } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
} = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');

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
      ui.error('Failed to get repository status', { exit: true });
    }

    const availableFiles = staged
      ? status.staged.map((f) => ({ value: f.file, label: chalk.yellow(`M ${f.file}`) }))
      : status.unstaged.map((f) => ({ value: f.file, label: chalk.yellow(`M ${f.file}`) }));

    if (availableFiles.length === 0) {
      ui.warn(`No ${staged ? 'staged' : 'unstaged'} files to restore`);
      return;
    }

    const selected = await ui.prompt.multiselect({
      message: `Select files to restore${staged ? ' (from staging)' : ''}:`,
      options: availableFiles,
      maxItems: 7,
    });

    if (selected === null || selected.length === 0) return;

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
