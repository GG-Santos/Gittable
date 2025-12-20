const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getBranches, getCurrentBranch } = require('../lib/git/exec');
const { createTable } = require('../lib/ui/table');
const { showBanner } = require('../lib/ui/banner');

const listBranches = async () => {
  const branches = getBranches();
  const _current = getCurrentBranch();

  const rows = branches.local.map((branch) => [
    branch.current ? chalk.green('*') : ' ',
    branch.current ? chalk.green.bold(branch.name) : branch.name,
    branch.upstream ? chalk.gray(`[${branch.upstream}]`) : chalk.dim('(no upstream)'),
  ]);

  console.log(createTable(['', 'Branch', 'Upstream'], rows));

  if (branches.remote.length > 0) {
    console.log(chalk.gray('\nRemote branches:'));
    for (const branch of branches.remote) {
      console.log(chalk.gray(`  ${branch.name}`));
    }
  }
};

const createBranch = async (name) => {
  if (!name) {
    name = await clack.text({
      message: chalk.cyan('Branch name:'),
      placeholder: 'feature/new-feature',
    });

    if (clack.isCancel(name)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Creating branch ${name}`);

  const result = execGit(`checkout -b ${name}`, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Branch ${name} created and checked out`));
  } else {
    clack.cancel(chalk.red('Failed to create branch'));
    console.error(result.error);
    process.exit(1);
  }
};

const checkoutBranch = async (name) => {
  const branches = getBranches();

  if (!name) {
    const options = branches.local.map((branch) => ({
      value: branch.name,
      label: branch.current ? chalk.green(`* ${branch.name}`) : branch.name,
    }));

    name = await clack.select({
      message: chalk.cyan('Select branch to checkout:'),
      options,
    });

    if (clack.isCancel(name)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Checking out ${name}`);

  const result = execGit(`checkout ${name}`, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Switched to branch ${name}`));
  } else {
    clack.cancel(chalk.red('Failed to checkout branch'));
    console.error(result.error);
    process.exit(1);
  }
};

const deleteBranch = async (name) => {
  const branches = getBranches();
  const current = getCurrentBranch();

  if (!name) {
    const options = branches.local
      .filter((branch) => !branch.current)
      .map((branch) => ({
        value: branch.name,
        label: branch.name,
      }));

    if (options.length === 0) {
      clack.cancel(chalk.yellow('No branches to delete'));
      return;
    }

    name = await clack.select({
      message: chalk.cyan('Select branch to delete:'),
      options,
    });

    if (clack.isCancel(name)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  if (name === current) {
    clack.cancel(chalk.red('Cannot delete current branch'));
    process.exit(1);
  }

  const confirm = await clack.confirm({
    message: chalk.yellow(`Delete branch ${name}?`),
    initialValue: false,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  const spinner = clack.spinner();
  spinner.start(`Deleting branch ${name}`);

  const result = execGit(`branch -d ${name}`, { silent: true });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Branch ${name} deleted`));
  } else {
    // Try force delete
    const forceConfirm = await clack.confirm({
      message: chalk.yellow('Branch not fully merged. Force delete?'),
      initialValue: false,
    });

    if (forceConfirm) {
      const forceResult = execGit(`branch -D ${name}`, { silent: true });
      if (forceResult.success) {
        clack.outro(chalk.green.bold(`Branch ${name} force deleted`));
      } else {
        clack.cancel(chalk.red('Failed to delete branch'));
        console.error(forceResult.error);
        process.exit(1);
      }
    } else {
      clack.cancel(chalk.yellow('Cancelled'));
    }
  }
};

module.exports = async (args) => {
  const action = args[0];

  // If no action provided, show interactive menu
  if (!action) {
    showBanner('BRANCH');

    // Check if TTY is available for interactive prompts
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Available actions:'));
      console.log(chalk.gray('  - gittable branch list'));
      console.log(chalk.gray('  - gittable branch create <name>'));
      console.log(chalk.gray('  - gittable branch checkout <name>'));
      console.log(chalk.gray('  - gittable branch delete <name>'));
      process.exit(1);
    }

    const selectedAction = await clack.select({
      message: chalk.cyan('What would you like to do?'),
      options: [
        { value: 'list', label: chalk.cyan('List branches') },
        { value: 'create', label: chalk.green('Create new branch') },
        { value: 'checkout', label: chalk.yellow('Checkout branch') },
        { value: 'delete', label: chalk.red('Delete branch') },
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
    showBanner('BRANCH');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Branch List')}`);
    await listBranches();
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'create' || action === 'new') {
    showBanner('BRANCH');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Create Branch')}`);
    await createBranch(args[1]);
    return;
  }

  if (action === 'checkout' || action === 'co') {
    showBanner('BRANCH');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Checkout Branch')}`);
    await checkoutBranch(args[1]);
    return;
  }

  if (action === 'delete' || action === 'del' || action === 'rm') {
    showBanner('BRANCH');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Delete Branch')}`);
    await deleteBranch(args[1]);
    return;
  }

  // Default: try to checkout
  showBanner('BRANCH');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Checkout Branch')}`);
  await checkoutBranch(action);
};
