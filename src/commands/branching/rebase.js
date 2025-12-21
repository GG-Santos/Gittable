const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getBranches, getCurrentBranch } = require('../../core/git');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  showBanner('REBASE');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Rebase')}`);

  const currentBranch = getCurrentBranch();
  const branches = getBranches();

  let targetBranch = args[0];

  if (!targetBranch) {
    // Check if TTY is available for interactive prompts
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Please provide a branch name: gittable rebase <branch>'));
      process.exit(1);
    }

    const options = branches.local
      .filter((branch) => !branch.current)
      .map((branch) => ({
        value: branch.name,
        label: branch.name,
      }));

    // Add remote branches option
    options.push({
      value: '__remote__',
      label: chalk.dim('Remote branch...'),
    });

    if (options.length === 0) {
      clack.cancel(chalk.yellow('No branches to rebase onto'));
      return;
    }

    const theme = getTheme();
    targetBranch = await clack.select({
      message: theme.primary('Select branch to rebase onto:'),
      options,
    });

    if (clack.isCancel(targetBranch)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

    if (targetBranch === '__remote__') {
      targetBranch = await clack.text({
        message: theme.primary('Remote branch (e.g., origin/main):'),
        placeholder: 'origin/main',
      });

      if (clack.isCancel(targetBranch)) {
        clack.cancel(chalk.yellow('Cancelled'));
        return;
      }
    }
  }

  const interactive = args.includes('--interactive') || args.includes('-i');
  const continueRebase = args.includes('--continue');
  const abortRebase = args.includes('--abort');

  if (continueRebase) {
    const spinner = clack.spinner();
    spinner.start('Continuing rebase');
    const result = execGit('rebase --continue', { silent: false });
    spinner.stop();

    if (result.success) {
      clack.outro(chalk.green.bold('Rebase continued'));
    } else {
      clack.cancel(chalk.red('Rebase continue failed'));
      console.error(result.error);
      process.exit(1);
    }
    return;
  }

  if (abortRebase) {
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive confirmation.'));
      process.exit(1);
    }

    const confirm = await clack.confirm({
      message: chalk.yellow('Abort rebase? This will lose any rebase progress.'),
      initialValue: false,
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

    const spinner = clack.spinner();
    spinner.start('Aborting rebase');
    const result = execGit('rebase --abort', { silent: true });
    spinner.stop();

    if (result.success) {
      clack.outro(chalk.green.bold('Rebase aborted'));
    } else {
      clack.cancel(chalk.red('Failed to abort rebase'));
      console.error(result.error);
      process.exit(1);
    }
    return;
  }

  // Offer to create backup before rebase
  if (process.stdin.isTTY) {
    const { createBackupBranch } = require('../../utils/backup-helpers');
    const { promptConfirm } = require('../../utils/command-helpers');

    const createBackup = await promptConfirm('Create backup branch before rebase?', true);

    if (createBackup) {
      const backupBranch = createBackupBranch('rebase');
      if (backupBranch) {
        console.log(chalk.green(`✓ Backup branch created: ${backupBranch}`));
        console.log(chalk.dim(`  Restore with: gittable restore-backup ${backupBranch}`));
      }
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Rebasing ${currentBranch} onto ${targetBranch}`);

  const command = interactive ? `rebase --interactive ${targetBranch}` : `rebase ${targetBranch}`;
  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Rebase completed'));
  } else {
    // Check if rebase conflict occurred
    const conflictCheck = execGit('diff --name-only --diff-filter=U', { silent: true });
    const hasConflicts = conflictCheck.success && conflictCheck.output.trim().length > 0;

    if (hasConflicts && process.stdin.isTTY) {
      console.log(chalk.yellow('\n⚠ Rebase conflicts detected'));

      const { showSmartSuggestion } = require('../../utils/command-helpers');
      const nextAction = await showSmartSuggestion('What would you like to do?', [
        {
          value: 'resolve',
          label:
            chalk.green('Resolve conflicts') + chalk.dim(' - List and resolve conflicted files'),
        },
        {
          value: 'mergetool',
          label: chalk.cyan('Use mergetool') + chalk.dim(' - Launch merge tool'),
        },
        {
          value: 'continue',
          label: chalk.cyan('Continue rebase') + chalk.dim(' - After resolving conflicts'),
        },
        { value: 'abort', label: chalk.red('Abort rebase') + chalk.dim(' - Cancel the rebase') },
        { value: 'skip', label: chalk.gray('Skip') },
      ]);

      if (
        nextAction &&
        nextAction !== 'skip' &&
        nextAction !== 'abort' &&
        nextAction !== 'continue'
      ) {
        const router = require('../../cli/router');
        await router.execute(nextAction, []);
      } else if (nextAction === 'continue') {
        const continueResult = execGit('rebase --continue', { silent: false });
        if (continueResult.success) {
          clack.outro(chalk.green.bold('Rebase continued'));
        } else {
          clack.cancel(chalk.red('Rebase continue failed'));
          console.error(continueResult.error);
        }
      } else if (nextAction === 'abort') {
        const { promptConfirm } = require('../../utils/command-helpers');
        const confirmed = await promptConfirm(
          'Abort rebase? This will lose any rebase progress.',
          false
        );
        if (confirmed) {
          const abortResult = execGit('rebase --abort', { silent: true });
          if (abortResult.success) {
            clack.outro(chalk.green.bold('Rebase aborted'));
          } else {
            clack.cancel(chalk.red('Failed to abort rebase'));
            console.error(abortResult.error);
          }
        }
      }
    } else {
      clack.cancel(chalk.red('Rebase failed'));
      console.error(result.error);
      console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
      console.log(chalk.gray('Use "gittable rebase --continue" to continue after resolving'));
      console.log(chalk.gray('Use "gittable rebase --abort" to abort the rebase'));
      process.exit(1);
    }
  }
};
