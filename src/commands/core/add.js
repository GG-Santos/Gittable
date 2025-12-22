const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getStatus } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
} = require('../../utils/command-helpers');
const { promptConfirm } = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

const stageFiles = async (files, args = []) => {
  if (!files || files.length === 0) {
    requireTTY([
      'Available options:',
      '  - gittable add <file1> <file2> ...',
      '  - gittable add --all (or -A)',
    ]);

    // Interactive mode: show unstaged files
    const status = getStatus();
    if (!status) {
      ui.error('Failed to get repository status', { exit: true });
    }

    // Use enhanced file selection with directory grouping
    const { createFileOptions } = require('../../utils/file-selection');
    const allFilesList = [...status.unstaged.map((f) => f.file), ...status.untracked];
    const statusMap = {
      ...Object.fromEntries(status.unstaged.map((f) => [f.file, 'M'])),
      ...Object.fromEntries(status.untracked.map((f) => [f, '?'])),
    };
    const showMetadata = args.includes('--metadata') || args.includes('-m');
    const allFiles = createFileOptions(allFilesList, statusMap, { showMetadata });

    if (allFiles.length === 0) {
      ui.warn('No files to stage');
      return;
    }

    // Filter out directory headers for selection
    const selectableOptions = allFiles.filter((opt) => !opt.disabled);

    const theme = getTheme();
    const selected = await ui.prompt.multiselect({
      message: 'Select files to stage:',
      options: allFiles,
    });

    // Filter out directory headers from selection
    const validSelected = Array.isArray(selected)
      ? selected.filter((file) => !file.startsWith('__dir__'))
      : [];

    if (handleCancel(validSelected)) return;

    files = validSelected;
  }

  await execGitWithSpinner(`add ${files.join(' ')}`, {
    spinnerText: `Staging ${files.length} file(s)`,
    successMessage: `Staged ${files.length} file(s)`,
    errorMessage: 'Failed to stage files',
  });

  // Smart suggestion: offer to commit after staging
  if (process.stdin.isTTY) {
    const { showSmartSuggestion } = require('../../utils/command-helpers');
    const nextAction = await showSmartSuggestion('Files staged. What would you like to do next?', [
      { value: 'commit', label: chalk.green('Commit') + chalk.dim(' - Create a commit') },
      {
        value: 'add-commit',
        label: chalk.cyan('Add & Commit') + chalk.dim(' - Stage more and commit'),
      },
      { value: 'skip', label: chalk.gray('Skip') },
    ]);

    if (nextAction && nextAction !== 'skip') {
      const router = require('../../cli/router');
      await router.execute(nextAction, []);
    }
  }
};

const stageAll = async () => {
  const confirmed = await promptConfirm('Stage all changes?', false);
  if (!confirmed) return;

  await execGitWithSpinner('add -A', {
    spinnerText: 'Staging all changes',
    successMessage: 'Staged all changes',
    errorMessage: 'Failed to stage files',
  });

  // Smart suggestion: offer to commit after staging all
  if (process.stdin.isTTY) {
    const { showSmartSuggestion } = require('../../utils/command-helpers');
    const nextAction = await showSmartSuggestion(
      'All changes staged. What would you like to do next?',
      [
        { value: 'commit', label: chalk.green('Commit') + chalk.dim(' - Create a commit') },
        {
          value: 'commit-push',
          label: chalk.cyan('Commit & Push') + chalk.dim(' - Commit and push'),
        },
        { value: 'quick', label: chalk.cyan('Quick') + chalk.dim(' - Commit and push') },
        { value: 'skip', label: chalk.gray('Skip') },
      ]
    );

    if (nextAction && nextAction !== 'skip') {
      const router = require('../../cli/router');
      const args = nextAction === 'quick' ? ['--all'] : [];
      await router.execute(nextAction, args);
    }
  }
};

const unstageFiles = async (files) => {
  if (!files || files.length === 0) {
    const status = getStatus();
    if (!status || status.staged.length === 0) {
      ui.warn('No staged files to unstage');
      return;
    }

    const options = status.staged.map((f) => ({
      value: f.file,
      label: `${f.status} ${f.file}`,
    }));

    const selected = await ui.prompt.multiselect({
      message: 'Select files to unstage:',
      options,
    });

    if (selected === null) return;

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
  // Filter out metadata flags from files array
  const files = args.filter((arg) => arg !== '--metadata' && arg !== '-m');
  await stageFiles(files, args);
};
