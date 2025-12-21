const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getStatus } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
} = require('../../utils/command-helpers');
const { commitFlow } = require('../../core/commit/flow');
const { getTheme } = require('../../utils/color-theme');

/**
 * Add + Commit command
 * Stages files and commits in one flow
 */
const stageFiles = async (files) => {
  if (!files || files.length === 0) {
    requireTTY([
      'Available options:',
      '  - gittable add-commit <file1> <file2> ...',
      '  - gittable add-commit --all (or -a)',
    ]);

    // Interactive mode: show unstaged files
    const status = getStatus();
    if (!status) {
      clack.cancel(chalk.red('Failed to get repository status'));
      process.exit(1);
    }

    // Use enhanced file selection with directory grouping
    const { createFileOptions } = require('../../utils/file-selection');
    const allFilesList = [...status.unstaged.map((f) => f.file), ...status.untracked];
    const statusMap = {
      ...Object.fromEntries(status.unstaged.map((f) => [f.file, 'M'])),
      ...Object.fromEntries(status.untracked.map((f) => [f, '?'])),
    };
    const allFiles = createFileOptions(allFilesList, statusMap);

    if (allFiles.length === 0) {
      clack.cancel(chalk.yellow('No files to stage'));
      return [];
    }

    const theme = getTheme();
    const selected = await clack.multiselect({
      message: theme.primary('Select files to stage:'),
      options: allFiles,
    });

    // Filter out directory headers from selection
    const validSelected = Array.isArray(selected)
      ? selected.filter((file) => !file.startsWith('__dir__'))
      : [];

    if (handleCancel(validSelected)) return [];

    return validSelected;
  }

  return files;
};

module.exports = async (args) => {
  showCommandHeader('ADD-COMMIT', 'Stage Files and Commit');

  requireTTY('Please use: git add <files> && git commit -m "message" for non-interactive mode');

  // Check for --all flag
  if (args.includes('--all') || args.includes('-a')) {
    // Stage all and commit
    await execGitWithSpinner('add -A', {
      spinnerText: 'Staging all changes',
      successMessage: null,
      errorMessage: 'Failed to stage files',
    });

    const commitOptions = {
      showHeader: false,
      showStagedFiles: true,
      all: true,
      allowEmpty: args.includes('--allow-empty'),
      amend: args.includes('--amend'),
      noVerify: args.includes('--no-verify'),
      noGpgSign: args.includes('--no-gpg-sign'),
    };

    try {
      await commitFlow(commitOptions);
    } catch (error) {
      clack.cancel(chalk.red('Commit failed'));
      console.error(error.message);
      process.exit(1);
    }
    return;
  }

  // Interactive file selection
  const filesToStage = await stageFiles(args);

  if (filesToStage.length === 0) {
    clack.cancel(chalk.yellow('No files selected'));
    return;
  }

  // Stage files
  await execGitWithSpinner(`add ${filesToStage.join(' ')}`, {
    spinnerText: `Staging ${filesToStage.length} file(s)`,
    successMessage: null, // Don't show success for intermediate step
    errorMessage: 'Failed to stage files',
  });

  // Commit
  const commitOptions = {
    showHeader: false,
    showStagedFiles: true,
    all: false,
    allowEmpty: args.includes('--allow-empty'),
    amend: args.includes('--amend'),
    noVerify: args.includes('--no-verify'),
    noGpgSign: args.includes('--no-gpg-sign'),
  };

  try {
    await commitFlow(commitOptions);
  } catch (error) {
    clack.cancel(chalk.red('Commit failed'));
    console.error(error.message);
    process.exit(1);
  }
};
