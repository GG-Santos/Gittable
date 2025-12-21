const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { createTable } = require('../../ui/table');
const { createActionRouter } = require('../../utils/action-router');
const { execGitWithSpinner, handleCancel, promptConfirm } = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

const listRemotes = () => {
  const result = execGit('remote -v', { silent: true });
  if (!result.success) {
    console.log(chalk.dim('No remotes found'));
    return;
  }

  const lines = result.output.trim().split('\n').filter(Boolean);
  const remotes = {};

  for (const line of lines) {
    const [name, url, type] = line.split(/\s+/);
    if (!remotes[name]) {
      remotes[name] = { name, url, fetch: '', push: '' };
    }
    if (type === '(fetch)') {
      remotes[name].fetch = url;
    } else if (type === '(push)') {
      remotes[name].push = url;
    }
  }

  const rows = Object.values(remotes).map((remote) => [
    remote.name,
    remote.fetch || remote.push,
    remote.fetch && remote.push && remote.fetch !== remote.push ? chalk.yellow('different') : '',
  ]);

  console.log(`\n${createTable(['Remote', 'URL', 'Note'], rows)}`);
};

const addRemote = async (args) => {
  let name = args[0];
  let url = args[1];

  if (!name) {
    const theme = getTheme();
    name = await clack.text({
      message: theme.primary('Remote name:'),
      placeholder: 'origin',
    });

    if (handleCancel(name)) return false;
  }

  if (!url) {
    const theme = getTheme();
    url = await clack.text({
      message: theme.primary('Remote URL:'),
      placeholder: 'https://github.com/user/repo.git',
    });

    if (handleCancel(url)) return false;
  }

  const result = await execGitWithSpinner(`remote add ${name} ${url}`, {
    spinnerText: `Adding remote ${name}`,
    successMessage: null, // Custom success message
    errorMessage: 'Failed to add remote',
    silent: true,
    onSuccess: () => {
      console.log(chalk.green(`✓ Remote ${name} added`));
    },
  });

  return result.success;
};

const removeRemote = async (args) => {
  let name = args[0];

  if (!name) {
    const theme = getTheme();
    name = await clack.text({
      message: theme.primary('Remote name to remove:'),
      placeholder: 'origin',
    });

    if (handleCancel(name)) return;
  }

  const confirmed = await promptConfirm(`Remove remote ${name}?`, false);
  if (!confirmed) return;

  await execGitWithSpinner(`remote remove ${name}`, {
    spinnerText: `Removing remote ${name}`,
    successMessage: `Remote ${name} removed`,
    errorMessage: 'Failed to remove remote',
    silent: true,
  });
};

const renameRemote = async (args) => {
  let oldName = args[0];
  let newName = args[1];

  if (!oldName) {
    const theme = getTheme();
    oldName = await clack.text({
      message: theme.primary('Current remote name:'),
      placeholder: 'origin',
    });

    if (handleCancel(oldName)) return;
  }

  if (!newName) {
    const theme = getTheme();
    newName = await clack.text({
      message: theme.primary('New remote name:'),
      placeholder: 'upstream',
    });

    if (handleCancel(newName)) return;
  }

  await execGitWithSpinner(`remote rename ${oldName} ${newName}`, {
    spinnerText: `Renaming remote ${oldName} to ${newName}`,
    successMessage: `Remote renamed to ${newName}`,
    errorMessage: 'Failed to rename remote',
    silent: true,
  });
};

const router = createActionRouter({
  commandName: 'REMOTE',
  helpText: [
    'Available actions:',
    '  - gittable remote list (or ls)',
    '  - gittable remote add <name> <url>',
    '  - gittable remote remove <name> (or rm)',
    '  - gittable remote rename <old> <new> (or mv)',
  ],
  actions: [
    {
      value: 'list',
      label: chalk.cyan('List remotes'),
      title: 'Remote List',
      handler: listRemotes,
      aliases: ['ls'],
    },
    {
      value: 'add',
      label: chalk.green('Add remote'),
      title: 'Add Remote',
      handler: addRemote,
    },
    {
      value: 'remove',
      label: chalk.red('Remove remote'),
      title: 'Remove Remote',
      handler: removeRemote,
      aliases: ['rm'],
    },
    {
      value: 'rename',
      label: chalk.yellow('Rename remote'),
      title: 'Rename Remote',
      handler: renameRemote,
      aliases: ['mv'],
    },
  ],
});

// Export the router as main export
module.exports = router;

// Export addRemote for use in other commands (with original signature)
module.exports.addRemote = async (name, url) => {
  return await addRemote([name, url]);
};
