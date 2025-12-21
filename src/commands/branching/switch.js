const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getBranches, getCurrentBranch } = require('../../core/git');
const { createActionRouter } = require('../../utils/action-router');
const { execGitWithSpinner, handleCancel } = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

const switchToBranch = async (args) => {
  const branches = getBranches();
  let name = args[0];

  if (!name) {
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Branch name required'));
      console.log(chalk.gray('Usage: gittable switch <branch-name>'));
      process.exit(1);
    }

    const branchOptions = branches.local.map((branch) => ({
      value: branch.name,
      label: branch.current ? `${chalk.green('*')} ${chalk.green.bold(branch.name)}` : branch.name,
    }));

    const theme = getTheme();
    name = await clack.select({
      message: theme.primary('Select branch to switch to:'),
      options: branchOptions,
    });

    if (handleCancel(name)) return;
  }

  const currentBranch = getCurrentBranch();
  if (name === currentBranch) {
    clack.cancel(chalk.yellow(`Already on branch ${name}`));
    return;
  }

  await execGitWithSpinner(`switch ${name}`, {
    spinnerText: `Switching to branch ${name}`,
    successMessage: `Switched to branch ${name}`,
    errorMessage: 'Failed to switch branch',
    silent: true,
  });
};

const createAndSwitch = async (args) => {
  let name = args[0];
  if (!name) {
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Branch name required'));
      console.log(chalk.gray('Usage: gittable switch -c <branch-name>'));
      process.exit(1);
    }

    const theme = getTheme();
    name = await clack.text({
      message: theme.primary('New branch name:'),
      placeholder: 'feature/new-feature',
    });

    if (handleCancel(name)) return;
  }

  await execGitWithSpinner(`switch -c ${name}`, {
    spinnerText: `Creating and switching to branch ${name}`,
    successMessage: `Created and switched to branch ${name}`,
    errorMessage: 'Failed to create branch',
    silent: true,
  });
};

module.exports = createActionRouter({
  commandName: 'SWITCH',
  helpText: [
    'Available actions:',
    '  - gittable switch <branch-name>',
    '  - gittable switch -c <branch-name> (create and switch)',
  ],
  actions: [
    {
      value: 'switch',
      label: chalk.cyan('Switch to branch'),
      title: 'Switch Branch',
      handler: switchToBranch,
      aliases: [],
    },
    {
      value: 'create',
      label: chalk.green('Create and switch to branch'),
      title: 'Create and Switch',
      handler: createAndSwitch,
      aliases: ['-c', 'new'],
    },
  ],
  defaultAction: switchToBranch,
});
