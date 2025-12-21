const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { createActionRouter } = require('../../utils/action-router');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
  promptConfirm,
} = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

const listSubmodules = async () => {
  const result = execGit('submodule status', { silent: true });

  if (result.success) {
    const output = result.output.trim();
    if (!output) {
      console.log(chalk.dim('No submodules found'));
      return;
    }

    const lines = output.split('\n').filter(Boolean);
    console.log(chalk.cyan.bold('Submodules:'));
    console.log();

    for (const line of lines) {
      const match = line.match(/^([\s-+U])([a-f0-9]+)\s+(.+?)(\s+\(.+\))?$/);
      if (match) {
        const status = match[1];
        const commit = match[2];
        const path = match[3];
        const info = match[4] || '';

        let statusColor = chalk.gray;
        let statusText = ' ';
        if (status === '-') {
          statusColor = chalk.red;
          statusText = 'Not initialized';
        } else if (status === '+') {
          statusColor = chalk.yellow;
          statusText = 'Different commit';
        } else if (status === 'U') {
          statusColor = chalk.red;
          statusText = 'Merge conflict';
        } else {
          statusText = 'Up to date';
        }

        console.log(`  ${chalk.green(path)}`);
        console.log(`    Commit: ${chalk.cyan(commit)}`);
        console.log(`    Status: ${statusColor(statusText)}${info ? chalk.gray(info) : ''}`);
        console.log();
      } else {
        console.log(chalk.gray(`  ${line}`));
      }
    }
  } else {
    clack.cancel(chalk.red('Failed to list submodules'));
    console.error(result.error);
  }
};

const addSubmodule = async (args) => {
  requireTTY('Please use: git submodule add <url> [path] for non-interactive mode');

  let url = args[0];
  let path = args[1];

  if (!url) {
    const theme = getTheme();
    url = await clack.text({
      message: theme.primary('Submodule repository URL:'),
      placeholder: 'https://github.com/user/repo.git',
    });
    if (handleCancel(url)) return;
  }

  if (!path) {
    // Extract path from URL if not provided
    const urlMatch = url.match(/\/([^\/]+?)(?:\.git)?$/);
    const defaultPath = urlMatch ? urlMatch[1] : 'submodule';

    const theme = getTheme();
    path = await clack.text({
      message: theme.primary('Submodule path:'),
      placeholder: defaultPath,
      initialValue: defaultPath,
    });
    if (handleCancel(path)) return;
  }

  await execGitWithSpinner(`submodule add ${url} ${path}`, {
    spinnerText: `Adding submodule ${path}`,
    successMessage: `Submodule added at ${path}`,
    errorMessage: 'Failed to add submodule',
    silent: true,
  });
};

const initSubmodules = async () => {
  await execGitWithSpinner('submodule update --init', {
    spinnerText: 'Initializing submodules',
    successMessage: 'Submodules initialized',
    errorMessage: 'Failed to initialize submodules',
    silent: true,
  });
};

const updateSubmodules = async (args) => {
  const recursive = args.includes('--recursive') || args.includes('--init');
  const init = args.includes('--init');

  let command = 'submodule update';
  if (recursive) command += ' --recursive';
  if (init) command += ' --init';

  await execGitWithSpinner(command, {
    spinnerText: 'Updating submodules',
    successMessage: 'Submodules updated',
    errorMessage: 'Failed to update submodules',
    silent: true,
  });
};

const removeSubmodule = async (args) => {
  let path = args[0];

  if (!path) {
    requireTTY('Please provide submodule path: gittable submodule remove <path>');

    const listResult = execGit('submodule status', { silent: true });
    if (listResult.success && listResult.output.trim()) {
      const lines = listResult.output.trim().split('\n');
      const submoduleOptions = lines
        .map((line) => {
          const match = line.match(/[\s-+U][a-f0-9]+\s+(.+?)(\s+\(.+\))?$/);
          return match
            ? {
                value: match[1],
                label: match[1],
              }
            : null;
        })
        .filter(Boolean);

      if (submoduleOptions.length === 0) {
        clack.cancel(chalk.yellow('No submodules to remove'));
        return;
      }

      const theme = getTheme();
      path = await clack.select({
        message: theme.primary('Select submodule to remove:'),
        options: submoduleOptions,
      });
      if (handleCancel(path)) return;
    } else {
      clack.cancel(chalk.yellow('No submodules found'));
      return;
    }
  }

  const confirmed = await promptConfirm(`Remove submodule ${path}?`);
  if (!confirmed) return;

  // Remove submodule (requires multiple steps)
  const spinner = clack.spinner();
  spinner.start(`Removing submodule ${path}`);

  try {
    // Remove from .gitmodules
    execGit(`submodule deinit -f ${path}`, { silent: true });
    // Remove from .git/config
    execGit(`config -f .git/config --remove-section submodule.${path}`, { silent: true });
    // Remove from index
    execGit(`rm -f --cached ${path}`, { silent: true });
    // Remove directory
    const fs = require('node:fs');
    const pathModule = require('node:path');
    const submodulePath = pathModule.join(process.cwd(), path);
    if (fs.existsSync(submodulePath)) {
      fs.rmSync(submodulePath, { recursive: true, force: true });
    }
    // Remove .git/modules
    const gitModulesPath = pathModule.join(process.cwd(), '.git', 'modules', path);
    if (fs.existsSync(gitModulesPath)) {
      fs.rmSync(gitModulesPath, { recursive: true, force: true });
    }

    spinner.stop();
    clack.outro(chalk.green.bold(`Submodule ${path} removed`));
  } catch (error) {
    spinner.stop();
    clack.cancel(chalk.red('Failed to remove submodule'));
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = createActionRouter({
  commandName: 'SUBMODULE',
  helpText: [
    'Manage submodules',
    'Available actions:',
    '  - gittable submodule list',
    '  - gittable submodule add <url> [path]',
    '  - gittable submodule init',
    '  - gittable submodule update',
    '  - gittable submodule remove <path>',
  ],
  actions: [
    {
      value: 'list',
      label: chalk.cyan('List submodules'),
      title: 'List Submodules',
      handler: listSubmodules,
      aliases: ['status', 'ls'],
    },
    {
      value: 'add',
      label: chalk.green('Add submodule'),
      title: 'Add Submodule',
      handler: addSubmodule,
    },
    {
      value: 'init',
      label: chalk.yellow('Initialize submodules'),
      title: 'Init Submodules',
      handler: initSubmodules,
    },
    {
      value: 'update',
      label: chalk.blue('Update submodules'),
      title: 'Update Submodules',
      handler: updateSubmodules,
      aliases: ['up'],
    },
    {
      value: 'remove',
      label: chalk.red('Remove submodule'),
      title: 'Remove Submodule',
      handler: removeSubmodule,
      aliases: ['rm'],
    },
  ],
  defaultAction: listSubmodules,
});
