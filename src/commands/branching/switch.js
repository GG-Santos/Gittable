const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getBranches, getCurrentBranch } = require('../../core/git');
const { createActionRouter } = require('../../utils/action-router');
const { execGitWithSpinner, handleCancel } = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

const switchToBranch = async (args) => {
  const branches = getBranches();
  let name = args[0];

  if (!name) {
    if (!process.stdin.isTTY) {
      ui.error('Branch name required', {
        suggestion: 'Usage: gittable switch <branch-name>',
        exit: true,
      });
    }

    const branchOptions = branches.local.map((branch) => ({
      value: branch.name,
      label: branch.current ? `${chalk.green('*')} ${chalk.green.bold(branch.name)}` : branch.name,
    }));

    name = await ui.prompt.select({
      message: 'Select branch to switch to:',
      options: branchOptions,
    });

    if (name === null) return;
  }

  const currentBranch = getCurrentBranch();
  if (name === currentBranch) {
    ui.warn(`Already on branch ${name}`);
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
      ui.error('Branch name required', {
        suggestion: 'Usage: gittable switch -c <branch-name>',
        exit: true,
      });
    }

    name = await ui.prompt.text({
      message: 'New branch name:',
      placeholder: 'feature/new-feature',
    });

    if (name === null) return;
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
