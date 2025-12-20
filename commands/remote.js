const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { createTable } = require('../lib/ui/table');
const { showBanner } = require('../lib/ui/banner');

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

const addRemote = async (name, url) => {
  if (!name) {
    name = await clack.text({
      message: chalk.cyan('Remote name:'),
      placeholder: 'origin',
    });

    if (clack.isCancel(name)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return false;
    }
  }

  if (!url) {
    url = await clack.text({
      message: chalk.cyan('Remote URL:'),
      placeholder: 'https://github.com/user/repo.git',
    });

    if (clack.isCancel(url)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return false;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Adding remote ${name}`);

  const result = execGit(`remote add ${name} ${url}`, { silent: true });
  spinner.stop();

  if (result.success) {
    console.log(chalk.green(`✓ Remote ${name} added`));
    return true;
  } else {
    clack.cancel(chalk.red('Failed to add remote'));
    console.error(result.error);
    return false;
  }
};

const removeRemote = async (name) => {
  if (!name) {
    name = await clack.text({
      message: chalk.cyan('Remote name to remove:'),
      placeholder: 'origin',
    });

    if (clack.isCancel(name)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const confirm = await clack.confirm({
    message: chalk.yellow(`Remove remote ${name}?`),
    initialValue: false,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  const spinner = clack.spinner();
  spinner.start(`Removing remote ${name}`);

  const result = execGit(`remote remove ${name}`, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Remote ${name} removed`));
  } else {
    clack.cancel(chalk.red('Failed to remove remote'));
    console.error(result.error);
    process.exit(1);
  }
};

const renameRemote = async (oldName, newName) => {
  if (!oldName) {
    oldName = await clack.text({
      message: chalk.cyan('Current remote name:'),
      placeholder: 'origin',
    });

    if (clack.isCancel(oldName)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  if (!newName) {
    newName = await clack.text({
      message: chalk.cyan('New remote name:'),
      placeholder: 'upstream',
    });

    if (clack.isCancel(newName)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Renaming remote ${oldName} to ${newName}`);

  const result = execGit(`remote rename ${oldName} ${newName}`, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Remote renamed to ${newName}`));
  } else {
    clack.cancel(chalk.red('Failed to rename remote'));
    console.error(result.error);
    process.exit(1);
  }
};

module.exports = async (args) => {
  const action = args[0];

  // If no action provided, show interactive menu
  if (!action) {
    showBanner('REMOTE');
    
    // Check if TTY is available for interactive prompts
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Available actions:'));
      console.log(chalk.gray('  - gittable remote list (or ls)'));
      console.log(chalk.gray('  - gittable remote add <name> <url>'));
      console.log(chalk.gray('  - gittable remote remove <name> (or rm)'));
      console.log(chalk.gray('  - gittable remote rename <old> <new> (or mv)'));
      process.exit(1);
    }
    
    const selectedAction = await clack.select({
      message: chalk.cyan('What would you like to do?'),
      options: [
        { value: 'list', label: chalk.cyan('List remotes') },
        { value: 'add', label: chalk.green('Add remote') },
        { value: 'remove', label: chalk.red('Remove remote') },
        { value: 'rename', label: chalk.yellow('Rename remote') },
      ],
    });

    if (clack.isCancel(selectedAction)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

    // Recursively call with the selected action
    return module.exports([selectedAction, ...args.slice(1)]);
  }

  if (action === 'list' || action === 'ls') {
    showBanner('REMOTE');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Remote List')}`);
    listRemotes();
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'add') {
    showBanner('REMOTE');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Add Remote')}`);
    await addRemote(args[1], args[2]);
    return;
  }

  if (action === 'remove' || action === 'rm') {
    showBanner('REMOTE');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Remove Remote')}`);
    await removeRemote(args[1]);
    return;
  }

  if (action === 'rename' || action === 'mv') {
    showBanner('REMOTE');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Rename Remote')}`);
    await renameRemote(args[1], args[2]);
    return;
  }

  // Unknown action - show help
  showBanner('REMOTE');
  clack.cancel(chalk.red(`Unknown action: ${action}`));
  console.log(chalk.yellow('\nAvailable actions:'));
  console.log(chalk.cyan('  list, ls    - List all remotes'));
  console.log(chalk.cyan('  add         - Add a new remote'));
  console.log(chalk.cyan('  remove, rm   - Remove a remote'));
  console.log(chalk.cyan('  rename, mv   - Rename a remote'));
  process.exit(1);
};

// Export addRemote for use in other commands
module.exports.addRemote = addRemote;
