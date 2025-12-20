const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getStatus, getCurrentBranch } = require('../lib/git/exec');
const { displayStatus } = require('../lib/ui/status-display');
const { showBanner } = require('../lib/ui/banner');

module.exports = async (_args) => {
  showBanner('STATUS');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Repository Status')}`);

  const branch = getCurrentBranch();
  const status = getStatus();

  if (!status) {
    clack.cancel(chalk.red('Failed to get repository status'));
    process.exit(1);
  }

  console.log(displayStatus(status, branch));
  clack.outro(chalk.green.bold('Status complete'));
};
