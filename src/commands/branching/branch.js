const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getBranches, getCurrentBranch } = require('../../core/git');
const { createTable } = require('../../ui/table');
const { createActionRouter } = require('../../utils/action-router');
const { execGitWithSpinner, handleCancel, promptConfirm } = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

const listBranches = async (args) => {
  const branches = getBranches();
  const _current = getCurrentBranch();
  const showAll = args.includes('--all') || args.includes('-a');

  // Paginate if many branches
  const { paginateList } = require('../../utils/list-pagination');
  const localBranches = showAll
    ? branches.local
    : paginateList(branches.local, 20, { title: 'branches' });

  const rows = localBranches.map((branch) => [
    branch.current ? chalk.green('*') : ' ',
    branch.current ? chalk.green.bold(branch.name) : branch.name,
    branch.upstream ? chalk.gray(`[${branch.upstream}]`) : chalk.dim('(no upstream)'),
  ]);

  console.log(createTable(['', 'Branch', 'Upstream'], rows));

  if (branches.remote.length > 0) {
    const remoteBranches = showAll
      ? branches.remote
      : paginateList(branches.remote, 20, { title: 'remote branches' });

    console.log(chalk.gray(`\nRemote branches (${branches.remote.length} total):`));
    for (const branch of remoteBranches) {
      console.log(chalk.gray(`  ${branch.name}`));
    }
    if (!showAll && branches.remote.length > 20) {
      console.log(
        chalk.dim(`  ... and ${branches.remote.length - 20} more (use --all to show all)`)
      );
    }
  }
};

const createBranch = async (args) => {
  let name = args[0];
  if (!name) {
    const theme = getTheme();
    name = await clack.text({
      message: theme.primary('Branch name:'),
      placeholder: 'feature/new-feature',
    });

    if (handleCancel(name)) return;
  }

  await execGitWithSpinner(`checkout -b ${name}`, {
    spinnerText: `Creating branch ${name}`,
    successMessage: `Branch ${name} created and checked out`,
    errorMessage: 'Failed to create branch',
    silent: true,
  });
};

const checkoutBranch = async (args) => {
  const branches = getBranches();
  let name = args[0];

  if (!name) {
    const options = branches.local.map((branch) => ({
      value: branch.name,
      label: branch.current ? chalk.green(`* ${branch.name}`) : branch.name,
    }));

    const theme = getTheme();
    name = await clack.select({
      message: theme.primary('Select branch to checkout:'),
      options,
    });

    if (handleCancel(name)) return;
  }

  await execGitWithSpinner(`checkout ${name}`, {
    spinnerText: `Checking out ${name}`,
    successMessage: `Switched to branch ${name}`,
    errorMessage: 'Failed to checkout branch',
    silent: true,
  });
};

const deleteBranch = async (args) => {
  const branches = getBranches();
  const current = getCurrentBranch();
  let name = args[0];

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

    const theme = getTheme();
    name = await clack.select({
      message: theme.primary('Select branch to delete:'),
      options,
    });

    if (handleCancel(name)) return;
  }

  if (name === current) {
    clack.cancel(chalk.red('Cannot delete current branch'));
    process.exit(1);
  }

  const confirmed = await promptConfirm(`Delete branch ${name}?`, false);
  if (!confirmed) return;

  const result = await execGitWithSpinner(`branch -d ${name}`, {
    spinnerText: `Deleting branch ${name}`,
    successMessage: `Branch ${name} deleted`,
    errorMessage: null, // Handle error case manually
    silent: true,
    onError: async (errorResult) => {
      // Try force delete
      const forceConfirmed = await promptConfirm('Branch not fully merged. Force delete?', false);
      if (forceConfirmed) {
        await execGitWithSpinner(`branch -D ${name}`, {
          spinnerText: `Force deleting branch ${name}`,
          successMessage: `Branch ${name} force deleted`,
          errorMessage: 'Failed to delete branch',
          silent: true,
        });
      } else {
        process.exit(1);
      }
    },
  });
};

module.exports = createActionRouter({
  commandName: 'BRANCH',
  helpText: [
    'Available actions:',
    '  - gittable branch list',
    '  - gittable branch create <name>',
    '  - gittable branch checkout <name>',
    '  - gittable branch delete <name>',
  ],
  actions: [
    {
      value: 'list',
      label: chalk.cyan('List branches'),
      title: 'Branch List',
      handler: (args) => listBranches(args || []),
    },
    {
      value: 'create',
      label: chalk.green('Create new branch'),
      title: 'Create Branch',
      handler: createBranch,
      aliases: ['new'],
    },
    {
      value: 'checkout',
      label: chalk.yellow('Checkout branch'),
      title: 'Checkout Branch',
      handler: checkoutBranch,
      aliases: ['co'],
    },
    {
      value: 'delete',
      label: chalk.red('Delete branch'),
      title: 'Delete Branch',
      handler: deleteBranch,
      aliases: ['del', 'rm'],
    },
  ],
  defaultAction: async (args) => {
    // Default: try to checkout
    await checkoutBranch(args);
  },
});
