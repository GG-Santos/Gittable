const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { createTable } = require('../../ui/components');
const { createActionRouter } = require('../../utils/commands/action-router');
const { execGitWithSpinner, handleCancel, promptConfirm } = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');

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
    name = await ui.prompt.text({
      message: 'Remote name:',
      placeholder: 'origin',
    });

    if (name === null) return false;
  }

  if (!url) {
    url = await ui.prompt.text({
      message: 'Remote URL:',
      placeholder: 'https://github.com/user/repo.git',
    });

    if (url === null) return false;
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
    name = await ui.prompt.text({
      message: 'Remote name to remove:',
      placeholder: 'origin',
    });

    if (name === null) return;
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
    oldName = await ui.prompt.text({
      message: 'Current remote name:',
      placeholder: 'origin',
    });

    if (oldName === null) return;
  }

  if (!newName) {
    newName = await ui.prompt.text({
      message: 'New remote name:',
      placeholder: 'upstream',
    });

    if (newName === null) return;
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
