const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, isGitRepo } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');
const _path = require('node:path');

module.exports = async (args) => {
  showBanner('INIT');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Initialize Repository')}`);

  if (isGitRepo()) {
    clack.cancel(chalk.yellow('Already a git repository'));
    return;
  }

  const dir = args[0] || '.';
  const bare = args.includes('--bare');
  const initialBranch =
    args.find((arg) => arg.startsWith('--initial-branch='))?.split('=')[1] || 'main';

  const spinner = clack.spinner();
  spinner.start(`Initializing repository${dir !== '.' ? ` in ${dir}` : ''}`);

  let command = `init`;
  if (bare) {
    command += ' --bare';
  }
  if (initialBranch) {
    command += ` --initial-branch=${initialBranch}`;
  }
  if (dir !== '.') {
    command += ` ${dir}`;
  }

  const result = execGit(command, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Repository initialized'));
  } else {
    clack.cancel(chalk.red('Failed to initialize repository'));
    console.error(result.error);
    process.exit(1);
  }
};
