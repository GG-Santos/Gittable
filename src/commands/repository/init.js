const clack = require('@clack/prompts');
const chalk = require('chalk');
const { isGitRepo } = require('../../core/git');
const { showCommandHeader, execGitWithSpinner } = require('../../utils/command-helpers');

module.exports = async (args) => {
  showCommandHeader('INIT', 'Initialize Repository');

  if (isGitRepo()) {
    clack.cancel(chalk.yellow('Already a git repository'));
    return;
  }

  const dir = args[0] || '.';
  const bare = args.includes('--bare');
  const initialBranch =
    args.find((arg) => arg.startsWith('--initial-branch='))?.split('=')[1] || 'main';

  let command = 'init';
  if (bare) {
    command += ' --bare';
  }
  if (initialBranch) {
    command += ` --initial-branch=${initialBranch}`;
  }
  if (dir !== '.') {
    command += ` ${dir}`;
  }

  await execGitWithSpinner(command, {
    spinnerText: `Initializing repository${dir !== '.' ? ` in ${dir}` : ''}`,
    successMessage: 'Repository initialized',
    errorMessage: 'Failed to initialize repository',
    silent: true,
  });
};
