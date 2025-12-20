const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../lib/git/exec');
const { createActionRouter } = require('../lib/utils/action-router');
const { showCommandHeader, requireTTY, execGitWithSpinner, handleCancel, promptConfirm } = require('../lib/utils/command-helpers');

const listWorktrees = async () => {
  const result = execGit('worktree list', { silent: true });
  
  if (result.success) {
    const lines = result.output.trim().split('\n').filter(Boolean);
    if (lines.length === 0) {
      console.log(chalk.dim('No worktrees found'));
      return;
    }
    
    console.log(chalk.cyan.bold('Worktrees:'));
    console.log();
    for (const line of lines) {
      const parts = line.split(/\s+/);
      const path = parts[0];
      const commit = parts[1];
      const branch = parts[2] || chalk.dim('(detached)');
      const isMain = parts[3] === '[bare]' || parts[3] === '[locked]';
      
      console.log(`  ${chalk.green(path)}`);
      console.log(`    Commit: ${chalk.cyan(commit)}`);
      console.log(`    Branch: ${branch}`);
      if (isMain) {
        console.log(`    ${chalk.yellow(parts[3])}`);
      }
      console.log();
    }
  } else {
    clack.cancel(chalk.red('Failed to list worktrees'));
    console.error(result.error);
  }
};

const addWorktree = async (args) => {
  requireTTY('Please use: git worktree add <path> [branch] for non-interactive mode');

  let path = args[0];
  let branch = args[1];
  let checkoutBranch = args.includes('-b') || args.includes('--create');

  if (!path) {
    path = await clack.text({
      message: chalk.cyan('Worktree path:'),
      placeholder: './feature-worktree',
    });
    if (handleCancel(path)) return;
  }

  if (!branch && !checkoutBranch) {
    const createNew = await clack.confirm({
      message: chalk.cyan('Create new branch for this worktree?'),
      initialValue: false,
    });
    
    if (clack.isCancel(createNew)) return;
    
    if (createNew) {
      checkoutBranch = true;
      branch = await clack.text({
        message: chalk.cyan('New branch name:'),
        placeholder: 'feature/new-feature',
      });
      if (handleCancel(branch)) return;
    } else {
      branch = await clack.text({
        message: chalk.cyan('Branch name (optional):'),
        placeholder: 'main',
        required: false,
      });
      if (clack.isCancel(branch)) branch = null;
    }
  }

  let command = `worktree add`;
  if (checkoutBranch && branch) {
    command += ` -b ${branch}`;
  } else if (branch) {
    command += ` ${branch}`;
  }
  command += ` ${path}`;

  await execGitWithSpinner(command, {
    spinnerText: `Adding worktree at ${path}`,
    successMessage: `Worktree added at ${path}`,
    errorMessage: 'Failed to add worktree',
    silent: true,
  });
};

const removeWorktree = async (args) => {
  let path = args[0];

  if (!path) {
    requireTTY('Please provide worktree path: gittable worktree remove <path>');
    
    // List worktrees first
    const listResult = execGit('worktree list', { silent: true });
    if (listResult.success) {
      const lines = listResult.output.trim().split('\n').filter(Boolean);
      if (lines.length === 0) {
        clack.cancel(chalk.yellow('No worktrees to remove'));
        return;
      }
      
      const worktreeOptions = lines.map((line) => {
        const worktreePath = line.split(/\s+/)[0];
        return {
          value: worktreePath,
          label: worktreePath,
        };
      });

      path = await clack.select({
        message: chalk.cyan('Select worktree to remove:'),
        options: worktreeOptions,
      });
      if (handleCancel(path)) return;
    } else {
      clack.cancel(chalk.red('Failed to list worktrees'));
      return;
    }
  }

  const confirmed = await promptConfirm(`Remove worktree at ${path}?`);
  if (!confirmed) return;

  await execGitWithSpinner(`worktree remove ${path}`, {
    spinnerText: `Removing worktree at ${path}`,
    successMessage: `Worktree removed`,
    errorMessage: 'Failed to remove worktree',
    silent: true,
  });
};

const pruneWorktrees = async () => {
  const confirmed = await promptConfirm('Prune worktrees (remove stale entries)?');
  if (!confirmed) return;

  await execGitWithSpinner('worktree prune', {
    spinnerText: 'Pruning worktrees',
    successMessage: 'Worktrees pruned',
    errorMessage: 'Failed to prune worktrees',
    silent: true,
  });
};

module.exports = createActionRouter({
  commandName: 'WORKTREE',
  helpText: [
    'Manage multiple working trees',
    'Available actions:',
    '  - gittable worktree list',
    '  - gittable worktree add <path> [branch]',
    '  - gittable worktree remove <path>',
    '  - gittable worktree prune',
  ],
  actions: [
    {
      value: 'list',
      label: chalk.cyan('List worktrees'),
      title: 'List Worktrees',
      handler: listWorktrees,
      aliases: ['ls'],
    },
    {
      value: 'add',
      label: chalk.green('Add worktree'),
      title: 'Add Worktree',
      handler: addWorktree,
    },
    {
      value: 'remove',
      label: chalk.red('Remove worktree'),
      title: 'Remove Worktree',
      handler: removeWorktree,
      aliases: ['rm'],
    },
    {
      value: 'prune',
      label: chalk.yellow('Prune worktrees'),
      title: 'Prune Worktrees',
      handler: pruneWorktrees,
    },
  ],
  defaultAction: listWorktrees,
});

