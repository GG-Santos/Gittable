const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getStatus, getCurrentBranch } = require('../../core/git');
const { displayStatus } = require('../../ui/status');
const { showCommandHeader, showSmartSuggestion } = require('../../utils/command-helpers');

module.exports = async (_args) => {
  showCommandHeader('STATUS', 'Repository Status');

  const branch = getCurrentBranch();
  const status = getStatus();

  if (!status) {
    ui.error('Failed to get repository status', { exit: true });
  }

  console.log(displayStatus(status, branch));

  // Smart suggestion: offer to add files if there are unstaged changes
  const hasUnstaged = status.unstaged.length > 0 || status.untracked.length > 0;
  if (hasUnstaged && process.stdin.isTTY) {
    const nextAction = await showSmartSuggestion('What would you like to do next?', [
      { value: 'add', label: chalk.green('Add files') + chalk.dim(' - Stage changes for commit') },
      {
        value: 'add-commit',
        label: chalk.cyan('Add & Commit') + chalk.dim(' - Stage and commit in one flow'),
      },
      { value: 'quick', label: chalk.cyan('Quick') + chalk.dim(' - Add, commit, and push') },
      { value: 'skip', label: chalk.gray('Skip') },
    ]);

    if (nextAction && nextAction !== 'skip') {
      const router = require('../../cli/router');
      await router.execute(nextAction, []);
    }
  } else {
    ui.success('Status complete');
  }
};
