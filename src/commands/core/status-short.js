const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getStatus, getCurrentBranch } = require('../../core/git');
const { showCommandHeader } = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

/**
 * Short status - One-line summary
 */
module.exports = async (_args) => {
  const branch = getCurrentBranch();
  const status = getStatus();
  const theme = getTheme();

  if (!status) {
    ui.error('Failed to get repository status', { exit: true });
  }

  const parts = [];

  // Branch
  if (branch) {
    parts.push(theme.primary(`on ${branch}`));
  }

  // Changes summary
  const staged = status.staged.length;
  const modified = status.unstaged.length;
  const untracked = status.untracked.length;

  if (staged > 0) {
    parts.push(theme.success(`+${staged}`));
  }
  if (modified > 0) {
    parts.push(theme.warning(`~${modified}`));
  }
  if (untracked > 0) {
    parts.push(theme.info(`?${untracked}`));
  }

  // Remote status
  if (status.ahead > 0) {
    parts.push(theme.success(`↑${status.ahead}`));
  }
  if (status.behind > 0) {
    parts.push(theme.error(`↓${status.behind}`));
  }
  if (status.diverged) {
    parts.push(theme.warning('⚠'));
  }

  if (parts.length === 0) {
    console.log(theme.success('✓ clean'));
  } else {
    console.log(parts.join(' '));
  }
};
