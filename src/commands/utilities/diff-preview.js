const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showCommandHeader, requireTTY, handleCancel } = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

/**
 * Diff-preview command - Show diff summary before committing
 */
module.exports = async (args) => {
  showCommandHeader('DIFF-PREVIEW', 'Preview Changes');

  requireTTY('Please use: git diff for non-interactive mode');

  const showStaged = !args.includes('--unstaged') && !args.includes('-u');
  const showUnstaged = args.includes('--unstaged') || args.includes('-u') || args.includes('--all');
  const showAll = args.includes('--all') || args.includes('-a');

  const theme = getTheme();
  // Get diff stats
  if (showStaged || showAll) {
    console.log(chalk.bold(theme.primary('\nStaged changes:')));
    const stagedResult = execGit('diff --cached --stat', { silent: true });
    if (stagedResult.success && stagedResult.output.trim()) {
      console.log(stagedResult.output);
    } else {
      console.log(chalk.dim('  (no staged changes)'));
    }
  }

  if (showUnstaged || showAll) {
    console.log(chalk.yellow.bold('\nUnstaged changes:'));
    const unstagedResult = execGit('diff --stat', { silent: true });
    if (unstagedResult.success && unstagedResult.output.trim()) {
      console.log(unstagedResult.output);
    } else {
      console.log(chalk.dim('  (no unstaged changes)'));
    }
  }

  // Ask if user wants to see full diff
  const { promptConfirm } = require('../../utils/command-helpers');
  const showFull = await promptConfirm('Show full diff?', false);

  if (showFull) {
    console.log(chalk.bold(theme.primary('\nFull diff:')));
    console.log(chalk.gray('─'.repeat(60)));

    if (showStaged || showAll) {
      const fullStaged = execGit('diff --cached', { silent: true });
      if (fullStaged.success && fullStaged.output.trim()) {
        console.log(fullStaged.output);
      }
    }

    if (showUnstaged || showAll) {
      const fullUnstaged = execGit('diff', { silent: true });
      if (fullUnstaged.success && fullUnstaged.output.trim()) {
        console.log(fullUnstaged.output);
      }
    }
  }

  console.log();
  ui.success('Preview complete');
};
