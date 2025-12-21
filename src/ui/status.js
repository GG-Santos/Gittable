const chalk = require('chalk');
const { createTable } = require('./table');
const { execGit } = require('../core/git/executor');
const { getRepositoryState } = require('../core/git/state');

const STATUS_COLORS = {
  M: chalk.yellow, // Modified
  A: chalk.green, // Added
  D: chalk.red, // Deleted
  R: chalk.blue, // Renamed
  C: chalk.magenta, // Copied
  U: chalk.red, // Unmerged
  '?': chalk.gray, // Untracked
};

const STATUS_LABELS = {
  M: 'Modified',
  A: 'Added',
  D: 'Deleted',
  R: 'Renamed',
  C: 'Copied',
  U: 'Unmerged',
  '?': 'Untracked',
};

/**
 * Display repository status in a formatted way
 */
const displayStatus = (status, branch) => {
  const sections = [];

  // Branch info
  if (branch) {
    const { getTheme } = require('../utils/color-theme');
    const theme = getTheme();
    sections.push(chalk.bold(theme.primary(`\nOn branch ${branch}`)));
  }

  // Show repository state (merge/rebase/cherry-pick)
  const repoState = getRepositoryState();
  if (repoState.merge) {
    sections.push(chalk.yellow.bold('⚠ Merge in progress'));
  } else if (repoState.rebase) {
    sections.push(chalk.yellow.bold('⚠ Rebase in progress'));
  } else if (repoState.cherryPick) {
    sections.push(chalk.yellow.bold('⚠ Cherry-pick in progress'));
  }

  // Get last commit info
  const lastCommitResult = execGit('log -1 --format="%ar|%s"', { silent: true });
  if (lastCommitResult.success) {
    const [timeAgo, message] = lastCommitResult.output.trim().split('|');
    if (timeAgo && message) {
      sections.push(
        chalk.dim(
          `Last commit: ${timeAgo} - ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
        )
      );
    }
  }

  // Ahead/Behind info (enhanced)
  if (status.ahead > 0 || status.behind > 0) {
    const info = [];
    if (status.ahead > 0) {
      info.push(chalk.green(`↑ ${status.ahead} commit(s) ahead`));
    }
    if (status.behind > 0) {
      info.push(chalk.red(`↓ ${status.behind} commit(s) behind`));
    }
    if (status.diverged) {
      sections.push(chalk.yellow.bold('⚠ Your branch has diverged from the remote'));
    }
    if (branch) {
      sections.push(`  ${info.join(', ')} of origin/${branch}`);
    }
  } else if (branch) {
    // Check if remote exists
    const remoteCheck = execGit('remote get-url origin', { silent: true });
    if (remoteCheck.success) {
      sections.push(chalk.green('  ✓ Up to date with origin'));
    }
  }

  // Staged changes
  if (status.staged.length > 0) {
    sections.push(chalk.green.bold('\nChanges to be committed:'));
    const rows = status.staged.map(({ status: stat, file }) => [
      chalk.green(STATUS_LABELS[stat] || stat),
      file,
    ]);
    sections.push(createTable(['Status', 'File'], rows));
  }

  // Unstaged changes
  if (status.unstaged.length > 0) {
    sections.push(chalk.yellow.bold('\nChanges not staged for commit:'));
    const rows = status.unstaged.map(({ status: stat, file }) => [
      chalk.yellow(STATUS_LABELS[stat] || stat),
      file,
    ]);
    sections.push(createTable(['Status', 'File'], rows));
  }

  // Untracked files
  if (status.untracked.length > 0) {
    sections.push(chalk.gray.bold('\nUntracked files:'));
    for (const file of status.untracked) {
      sections.push(chalk.gray(`  ${file}`));
    }
  }

  // Clean working tree
  if (status.staged.length === 0 && status.unstaged.length === 0 && status.untracked.length === 0) {
    sections.push(chalk.green('\nWorking tree clean'));
  }

  return sections.join('\n');
};

module.exports = {
  displayStatus,
  STATUS_COLORS,
  STATUS_LABELS,
};
