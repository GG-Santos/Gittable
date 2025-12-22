const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getStatus } = require('../../core/git');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
  promptConfirm,
} = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');
const { execSync } = require('node:child_process');

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

    // Use enhanced file selection with new display format
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

    const theme = getTheme();
    const selected = await ui.prompt.multiselect({
      message: 'Select files to stage:',
      options: allFiles,
      maxItems: 7,
    });

    if (handleCancel(selected)) return;

    files = selected;
  }

  await execGitWithSpinner(`add ${files.join(' ')}`, {
    spinnerText: `Staging ${files.length} file(s)`,
    successMessage: `Staged ${files.length} file(s)`,
    errorMessage: 'Failed to stage files',
  });

  // Smart suggestion: offer to commit after staging
  if (process.stdin.isTTY) {
    const { showSmartSuggestion } = require('../../utils/commands');
    const nextAction = await showSmartSuggestion('Files staged. What would you like to do next?', [
      { value: 'commit', label: chalk.green('Commit') + chalk.dim(' - Create a commit') },
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
    const { showSmartSuggestion } = require('../../utils/commands');
    const nextAction = await showSmartSuggestion(
      'All changes staged. What would you like to do next?',
      [
        { value: 'commit', label: chalk.green('Commit') + chalk.dim(' - Create a commit') },
        {
          value: 'commit-push',
          label: chalk.cyan('Commit & Push') + chalk.dim(' - Commit and push'),
        },
        { value: 'skip', label: chalk.gray('Skip') },
      ]
    );

    if (nextAction && nextAction !== 'skip') {
      const router = require('../../cli/router');
      await router.execute(nextAction, []);
    }
  }
};

const stageByPattern = async (pattern = null) => {
  requireTTY('Please use: git add <pattern> for non-interactive mode');

  if (!pattern) {
    pattern = await ui.prompt.text({
      message: 'File pattern (e.g., *.js, src/**/*.ts, **/*.test.js):',
      placeholder: '*.js',
    });

    if (handleCancel(pattern)) return;
  }

  // Get files matching pattern
  let matchingFiles = [];
  try {
    const result = execSync(
      'git ls-files --others --exclude-standard --cached --modified --deleted',
      {
        encoding: 'utf8',
        cwd: process.cwd(),
      }
    );

    const allFiles = result.trim().split('\n').filter(Boolean);

    // Simple glob matching (basic implementation)
    const regexPattern = pattern
      .replace(/\*\*/g, '___DOUBLE_STAR___')
      .replace(/\*/g, '[^/]*')
      .replace(/___DOUBLE_STAR___/g, '.*')
      .replace(/\?/g, '[^/]');

    const regex = new RegExp(`^${regexPattern}$`);
    matchingFiles = allFiles.filter((file) => regex.test(file));
  } catch (error) {
    ui.error(`Failed to find files matching pattern: ${error.message}`, { exit: true });
  }

  if (matchingFiles.length === 0) {
    ui.warn(`No files found matching pattern: ${pattern}`);
    return;
  }

  // Show matching files using new display format
  const { createFileOptions } = require('../../utils/file-selection');
  const theme = getTheme();
  const matchingFileOptions = createFileOptions(matchingFiles, {});
  
  console.log(theme.primary(`\nFound ${matchingFiles.length} file(s) matching "${pattern}":`));
  
  // Show files with scrolling if there are many
  if (matchingFiles.length <= 20) {
    matchingFileOptions.forEach((opt) => {
      console.log(theme.dim(`  - ${opt.label}`));
    });
  } else {
    matchingFileOptions.slice(0, 20).forEach((opt) => {
      console.log(theme.dim(`  - ${opt.label}`));
    });
    console.log(theme.dim(`  ... and ${matchingFiles.length - 20} more`));
  }

  // Confirm
  const confirmed = await promptConfirm(`Stage ${matchingFiles.length} file(s)?`, true);

  if (!confirmed) {
    return;
  }

  // Stage files
  await execGitWithSpinner(`add ${matchingFiles.join(' ')}`, {
    spinnerText: `Staging ${matchingFiles.length} file(s)`,
    successMessage: `Staged ${matchingFiles.length} file(s) matching "${pattern}"`,
    errorMessage: 'Failed to stage files',
  });
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
      maxItems: 7,
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

const showAddMenu = async () => {
  const theme = getTheme();
  const action = await ui.prompt.select({
    message: theme.primary('How would you like to stage files?'),
    options: [
      {
        value: 'all',
        label: chalk.green('Stage All') + chalk.dim(' - Stage all changes'),
      },
      {
        value: 'select',
        label: chalk.cyan('Select Files') + chalk.dim(' - Choose specific files'),
      },
      {
        value: 'pattern',
        label: chalk.yellow('Pattern') + chalk.dim(' - Stage files matching a pattern'),
      },
    ],
  });

  if (handleCancel(action)) return;

  switch (action) {
    case 'all':
      await stageAll();
      break;
    case 'select':
      await stageFiles([], []);
      break;
    case 'pattern':
      await stageByPattern();
      break;
  }
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

  // If no files provided, show menu
  const files = args.filter((arg) => arg !== '--metadata' && arg !== '-m');
  if (files.length === 0) {
    showCommandHeader('ADD', 'Stage Files');
    await showAddMenu();
    return;
  }

  // Default: stage files
  showCommandHeader('ADD', 'Stage Files');
  await stageFiles(files, args);
};
