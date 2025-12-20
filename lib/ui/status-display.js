const chalk = require('chalk');
const { createTable } = require('./table');

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
    sections.push(chalk.cyan.bold(`\nOn branch ${branch}`));
  }

  // Ahead/Behind info
  if (status.ahead > 0 || status.behind > 0) {
    const info = [];
    if (status.ahead > 0) {
      info.push(chalk.green(`${status.ahead} ahead`));
    }
    if (status.behind > 0) {
      info.push(chalk.red(`${status.behind} behind`));
    }
    if (status.diverged) {
      sections.push(chalk.yellow('Your branch has diverged from the remote'));
    }
    sections.push(`  ${info.join(', ')} of origin/${branch}`);
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
