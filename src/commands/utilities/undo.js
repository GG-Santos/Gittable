const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { createTable } = require('../../ui/components');
const { showBanner } = require('../../ui/components');
const { getTheme } = require('../../utils/ui');

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
      ui.error('Interactive mode required', {
        suggestion: 'Please provide a ref: gittable undo reset <ref>',
        exit: true,
      });
    }

    if (entries.length === 0) {
      ui.warn('No reflog entries available');
      return;
    }

    const options = entries.slice(0, 20).map((entry) => ({
      value: entry.ref,
      label: `${entry.ref} - ${entry.message}`,
    }));

    ref = await ui.prompt.select({
      message: 'Select commit to reset to:',
      options,
    });

    if (ref === null) return;
  }

  if (!process.stdin.isTTY) {
    ui.error('Interactive mode required', {
      suggestion: 'Please use: gittable undo reset <ref> --soft|--mixed|--hard',
      exit: true,
    });
  }

  const mode = await ui.prompt.select({
    message: 'Reset mode:',
    options: [
      { value: '--soft', label: 'Soft (keep changes staged)' },
      { value: '--mixed', label: 'Mixed (keep changes unstaged)', hint: 'default' },
      { value: '--hard', label: 'Hard (discard all changes)', hint: 'dangerous' },
    ],
  });

  if (mode === null) return;

  if (mode === '--hard') {
    // Offer to create backup before hard reset
    const { createBackupBranch, saveCommitHash } = require('../../utils/backup-helpers');
    const { promptConfirm } = require('../../utils/commands');

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

    const confirm = await ui.prompt.confirm({
      message: 'Hard reset will discard all changes. Continue?',
      initialValue: false,
    });

    if (!confirm) {
      return;
    }
  }

  const spinner = ui.prompt.spinner();
  spinner.start(`Resetting to ${ref}`);

  const result = execGit(`reset ${mode} ${ref}`, { silent: false });
  spinner.stop();

  if (result.success) {
    ui.success(`Reset to ${ref}`);
  } else {
    ui.error('Reset failed', {
      suggestion: result.error,
      exit: true,
    });
  }
};

const undoLastCommit = async () => {
  if (!process.stdin.isTTY) {
    ui.error('Interactive mode required', {
      suggestion: 'Please use: git reset --soft|--mixed|--hard HEAD~1',
      exit: true,
    });
  }

  const mode = await ui.prompt.select({
    message: 'Undo last commit:',
    options: [
      { value: '--soft', label: 'Keep changes staged' },
      { value: '--mixed', label: 'Keep changes unstaged', hint: 'default' },
      { value: '--hard', label: 'Discard all changes', hint: 'dangerous' },
    ],
  });

  if (mode === null) return;

  if (mode === '--hard') {
    const confirm = await ui.prompt.confirm({
      message: 'This will discard all changes. Continue?',
      initialValue: false,
    });

    if (!confirm) {
      return;
    }
  }

  const spinner = ui.prompt.spinner();
  spinner.start('Undoing last commit');

  const result = execGit(`reset ${mode} HEAD~1`, { silent: false });
  spinner.stop();

  if (result.success) {
    ui.success('Last commit undone');
  } else {
    ui.error('Failed to undo commit', {
      suggestion: result.error,
      exit: true,
    });
  }
};

module.exports = async (args) => {
  const action = args[0];

  if (action === 'reflog' || action === 'log') {
    showBanner('UNDO');
    console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Reflog Browser')}`);
    showReflog();
    ui.success('Done');
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
