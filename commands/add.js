const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getStatus } = require('../lib/git/exec');
const { showCommandHeader, requireTTY, execGitWithSpinner, handleCancel } = require('../lib/utils/command-helpers');
const { promptConfirm } = require('../lib/utils/command-helpers');

const stageFiles = async (files) => {
  if (!files || files.length === 0) {
    requireTTY([
      'Available options:',
      '  - gittable add <file1> <file2> ...',
      '  - gittable add --all (or -A)',
    ]);

    // Interactive mode: show unstaged files
    const status = getStatus();
    if (!status) {
      clack.cancel(chalk.red('Failed to get repository status'));
      process.exit(1);
    }

    const allFiles = [
      ...status.unstaged.map((f) => ({
        value: f.file,
        label: chalk.yellow(`M ${f.file}`),
        hint: 'modified',
      })),
      ...status.untracked.map((f) => ({
        value: f,
        label: chalk.green(`? ${f}`),
        hint: 'untracked',
      })),
    ];

    if (allFiles.length === 0) {
      clack.cancel(chalk.yellow('No files to stage'));
      return;
    }

    const selected = await clack.multiselect({
      message: chalk.cyan('Select files to stage:'),
      options: allFiles,
    });

    if (handleCancel(selected)) return;

    files = selected;
  }

  await execGitWithSpinner(`add ${files.join(' ')}`, {
    spinnerText: `Staging ${files.length} file(s)`,
    successMessage: `Staged ${files.length} file(s)`,
    errorMessage: 'Failed to stage files',
  });
};

const stageAll = async () => {
  const confirmed = await promptConfirm('Stage all changes?', false);
  if (!confirmed) return;

  await execGitWithSpinner('add -A', {
    spinnerText: 'Staging all changes',
    successMessage: 'Staged all changes',
    errorMessage: 'Failed to stage files',
  });
};

const unstageFiles = async (files) => {
  if (!files || files.length === 0) {
    const status = getStatus();
    if (!status || status.staged.length === 0) {
      clack.cancel(chalk.yellow('No staged files to unstage'));
      return;
    }

    const options = status.staged.map((f) => ({
      value: f.file,
      label: `${f.status} ${f.file}`,
    }));

    const selected = await clack.multiselect({
      message: chalk.cyan('Select files to unstage:'),
      options,
    });

    if (handleCancel(selected)) return;

    files = selected;
  }

  await execGitWithSpinner(`reset HEAD -- ${files.join(' ')}`, {
    spinnerText: `Unstaging ${files.length} file(s)`,
    successMessage: `Unstaged ${files.length} file(s)`,
    errorMessage: 'Failed to unstage files',
  });
};

module.exports = async (args) => {
  const action = args[0];

  if (action === '--all' || action === '-A') {
    showCommandHeader('ADD', 'Stage All Changes');
    await stageAll();
    return;
  }

  if (action === '--unstage' || action === 'unstage') {
    showCommandHeader('ADD', 'Unstage Files');
    await unstageFiles(args.slice(1));
    return;
  }

  // Default: stage files
  showCommandHeader('ADD', 'Stage Files');
  await stageFiles(args);
};
