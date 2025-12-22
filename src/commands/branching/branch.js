const chalk = require('chalk');
const ui = require('../../ui/framework');
const { getBranches, getCurrentBranch } = require('../../core/git');
const { createTable } = require('../../ui/components');
const { createActionRouter } = require('../../utils/commands/action-router');
const { execGitWithSpinner, handleCancel, promptConfirm } = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');

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
    name = await ui.prompt.text({
      message: 'Branch name:',
      placeholder: 'feature/new-feature',
    });

    if (name === null) return;
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

    name = await ui.prompt.select({
      message: 'Select branch to checkout:',
      options,
    });

    if (name === null) return;
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
      ui.warn('No branches to delete');
      return;
    }

    name = await ui.prompt.select({
      message: 'Select branch to delete:',
      options,
    });

    if (name === null) return;
  }

  if (name === current) {
    ui.error('Cannot delete current branch', { exit: true });
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
        const { CancelledError } = require('../../core/errors');
        throw new CancelledError('Branch deletion cancelled');
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
