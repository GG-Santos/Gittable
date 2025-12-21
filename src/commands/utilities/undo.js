const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { createTable } = require('../../ui/table');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');

const getReflog = (limit = 30) => {
  const result = execGit(`reflog --format="%gd|%ar|%gs" -n ${limit}`, { silent: true });
  if (!result.success) return [];

  return result.output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [ref, date, ...messageParts] = line.split('|');
      return {
        ref,
        date,
        message: messageParts.join('|'),
      };
    });
};

const showReflog = () => {
  const entries = getReflog();

  if (entries.length === 0) {
    console.log(chalk.dim('No reflog entries found'));
    return;
  }

  const rows = entries.map((entry) => [
    chalk.cyan(entry.ref),
    chalk.gray(entry.date),
    entry.message,
  ]);

  console.log(`\n${createTable(['Ref', 'Date', 'Action'], rows)}`);
};

const resetToRef = async (ref) => {
  const entries = getReflog();

  if (!ref) {
    if (!process.stdin.isTTY) {
      clack.cancel(chalk.red('Interactive mode required'));
      console.log(chalk.yellow('This command requires interactive input.'));
      console.log(chalk.gray('Please provide a ref: gittable undo reset <ref>'));
      process.exit(1);
    }

    if (entries.length === 0) {
      clack.cancel(chalk.yellow('No reflog entries available'));
      return;
    }

    const options = entries.slice(0, 20).map((entry) => ({
      value: entry.ref,
      label: `${entry.ref} - ${entry.message}`,
    }));

    const theme = getTheme();
    ref = await clack.select({
      message: theme.primary('Select commit to reset to:'),
      options,
    });

    if (clack.isCancel(ref)) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  if (!process.stdin.isTTY) {
    clack.cancel(chalk.red('Interactive mode required'));
    console.log(chalk.yellow('This command requires interactive input.'));
    console.log(chalk.gray('Please use: gittable undo reset <ref> --soft|--mixed|--hard'));
    process.exit(1);
  }

  const theme = getTheme();
  const mode = await clack.select({
    message: theme.primary('Reset mode:'),
    options: [
      { value: '--soft', label: 'Soft (keep changes staged)' },
      { value: '--mixed', label: 'Mixed (keep changes unstaged)', hint: 'default' },
      { value: '--hard', label: 'Hard (discard all changes)', hint: 'dangerous' },
    ],
  });

  if (clack.isCancel(mode)) {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  if (mode === '--hard') {
    // Offer to create backup before hard reset
    const { createBackupBranch, saveCommitHash } = require('../../utils/backup-helpers');
    const { promptConfirm } = require('../../utils/command-helpers');

    const createBackup = await promptConfirm('Create backup branch before hard reset?', true);

    let backupBranch = null;
    let commitHash = null;

    if (createBackup) {
      backupBranch = createBackupBranch('hard-reset');
      commitHash = saveCommitHash();

      if (backupBranch) {
        console.log(chalk.green(`✓ Backup branch created: ${backupBranch}`));
        if (commitHash) {
          console.log(chalk.dim(`  Commit hash: ${commitHash}`));
        }
      }
    }

    const confirm = await clack.confirm({
      message: chalk.red('Hard reset will discard all changes. Continue?'),
      initialValue: false,
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Resetting to ${ref}`);

  const result = execGit(`reset ${mode} ${ref}`, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold(`Reset to ${ref}`));
  } else {
    clack.cancel(chalk.red('Reset failed'));
    console.error(result.error);
    process.exit(1);
  }
};

const undoLastCommit = async () => {
  if (!process.stdin.isTTY) {
    clack.cancel(chalk.red('Interactive mode required'));
    console.log(chalk.yellow('This command requires interactive input.'));
    console.log(chalk.gray('Please use: git reset --soft|--mixed|--hard HEAD~1'));
    process.exit(1);
  }

  const theme = getTheme();
  const mode = await clack.select({
    message: theme.primary('Undo last commit:'),
    options: [
      { value: '--soft', label: 'Keep changes staged' },
      { value: '--mixed', label: 'Keep changes unstaged', hint: 'default' },
      { value: '--hard', label: 'Discard all changes', hint: 'dangerous' },
    ],
  });

  if (clack.isCancel(mode)) {
    clack.cancel(chalk.yellow('Cancelled'));
    return;
  }

  if (mode === '--hard') {
    const confirm = await clack.confirm({
      message: chalk.red('This will discard all changes. Continue?'),
      initialValue: false,
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
  spinner.start('Undoing last commit');

  const result = execGit(`reset ${mode} HEAD~1`, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Last commit undone'));
  } else {
    clack.cancel(chalk.red('Failed to undo commit'));
    console.error(result.error);
    process.exit(1);
  }
};

module.exports = async (args) => {
  const action = args[0];

  if (action === 'reflog' || action === 'log') {
    showBanner('UNDO');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Reflog Browser')}`);
    showReflog();
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (action === 'reset') {
    showBanner('UNDO');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Reset to Commit')}`);
    await resetToRef(args[1]);
    return;
  }

  if (action === 'last' || !action) {
    showBanner('UNDO');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Undo Last Commit')}`);
    await undoLastCommit();
    return;
  }

  // Try to reset to the provided ref
  showBanner('UNDO');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Reset to Commit')}`);
  await resetToRef(action);
};
