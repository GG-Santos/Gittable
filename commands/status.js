const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getStatus, getCurrentBranch } = require('../lib/git/exec');
const { displayStatus } = require('../lib/ui/status-display');
const { showCommandHeader } = require('../lib/utils/command-helpers');

module.exports = async (_args) => {
  showCommandHeader('STATUS', 'Repository Status');

  const branch = getCurrentBranch();
  const status = getStatus();

  if (!status) {
    clack.cancel(chalk.red('Failed to get repository status'));
    process.exit(1);
  }

  console.log(displayStatus(status, branch));
  clack.outro(chalk.green.bold('Status complete'));
};
