const chalk = require('chalk');
const ui = require('../../ui/framework');
const { showCommandHeader } = require('../../utils/commands');
const { getStatus } = require('../../core/git');
const { execGit } = require('../../core/git');
const { getTheme } = require('../../utils/ui');

/**
 * Preview diff before staging or committing
 */
module.exports = async (args) => {
  showCommandHeader('PREVIEW-DIFF', 'Preview Changes');

  const type = args[0] || 'staged'; // staged, unstaged, all
  let files = args.slice(1);

  if (type === 'staged' || type === 'cached') {
    // Show staged changes
    if (files.length === 0) {
      const result = execGit('diff --cached --name-only', { silent: true });
      if (result.success && result.output.trim()) {
        files = result.output.trim().split('\n').filter(Boolean);
      }
    }

    if (files.length === 0) {
      ui.warn('No staged changes to preview');
      return;
    }

    const theme = getTheme();
    console.log(chalk.bold(theme.primary('\nStaged changes:')));
    for (const file of files) {
      console.log(chalk.green(`\n--- ${file}`));
      const diffResult = execGit(`diff --cached ${file}`, { silent: true });
      if (diffResult.success) {
        console.log(diffResult.output);
      }
    }
  } else if (type === 'unstaged' || type === 'working') {
    // Show unstaged changes
    if (files.length === 0) {
      const status = getStatus();
      if (status) {
        files = status.unstaged.map((f) => f.file);
      }
    }

    if (files.length === 0) {
      ui.warn('No unstaged changes to preview');
      return;
    }

    const theme2 = getTheme();
    console.log(chalk.bold(theme2.primary('\nUnstaged changes:')));
    for (const file of files) {
      console.log(chalk.yellow(`\n--- ${file}`));
      const diffResult = execGit(`diff ${file}`, { silent: true });
      if (diffResult.success) {
        console.log(diffResult.output);
      }
    }
  } else if (type === 'all') {
    // Show all changes
    const status = getStatus();
    if (!status) {
      ui.warn('No changes to preview');
      return;
    }

    const allFiles = [
      ...status.staged.map((f) => ({ file: f.file, type: 'staged' })),
      ...status.unstaged.map((f) => ({ file: f.file, type: 'unstaged' })),
    ];

    if (allFiles.length === 0) {
      ui.warn('No changes to preview');
      return;
    }

    const theme3 = getTheme();
    console.log(chalk.bold(theme3.primary('\nAll changes:')));
    for (const { file, type: fileType } of allFiles) {
      const color = fileType === 'staged' ? chalk.green : chalk.yellow;
      console.log(color(`\n--- ${file} (${fileType})`));
      const command = fileType === 'staged' ? `diff --cached ${file}` : `diff ${file}`;
      const diffResult = execGit(command, { silent: true });
      if (diffResult.success) {
        console.log(diffResult.output);
      }
    }
  } else {
    // Show diff for specific file(s)
    for (const file of files.length > 0 ? files : [type]) {
      console.log(chalk.cyan(`\n--- ${file}`));
      const diffResult = execGit(`diff ${file}`, { silent: true });
      if (diffResult.success) {
        console.log(diffResult.output);
      } else {
        // Try staged diff
        const stagedDiff = execGit(`diff --cached ${file}`, { silent: true });
        if (stagedDiff.success) {
          console.log(chalk.green('(staged)'));
          console.log(stagedDiff.output);
        }
      }
    }
  }

  ui.success('Preview complete');
};
