const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getStatus, getCurrentBranch } = require('../../core/git');
const { showCommandHeader } = require('../../utils/command-helpers');

/**
 * Short status - One-line summary
 */
module.exports = async (_args) => {
  const branch = getCurrentBranch();
  const status = getStatus();

  if (!status) {
    clack.cancel(chalk.red('Failed to get repository status'));
    process.exit(1);
  }

  const parts = [];

  // Branch
  if (branch) {
    parts.push(chalk.cyan(`on ${branch}`));
  }

  // Changes summary
  const staged = status.staged.length;
  const modified = status.unstaged.length;
  const untracked = status.untracked.length;

  if (staged > 0) {
    parts.push(chalk.green(`+${staged}`));
  }
  if (modified > 0) {
    parts.push(chalk.yellow(`~${modified}`));
  }
  if (untracked > 0) {
    parts.push(chalk.cyan(`?${untracked}`));
  }

  // Remote status
  if (status.ahead > 0) {
    parts.push(chalk.green(`↑${status.ahead}`));
  }
  if (status.behind > 0) {
    parts.push(chalk.red(`↓${status.behind}`));
  }
  if (status.diverged) {
    parts.push(chalk.yellow('⚠'));
  }

  if (parts.length === 0) {
    console.log(chalk.green('✓ clean'));
  } else {
    console.log(parts.join(' '));
  }
};
