const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { createActionRouter } = require('../../utils/action-router');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  handleCancel,
  promptConfirm,
} = require('../../utils/command-helpers');

const startBisect = async (args) => {
  requireTTY('Please use: git bisect start <bad> <good> for non-interactive mode');

  let bad = args[0];
  let good = args[1];

  if (!bad) {
    bad = await clack.text({
      message: chalk.red('Bad commit (where the bug exists):'),
      placeholder: 'HEAD',
    });
    if (handleCancel(bad)) return;
  }

  if (!good) {
    good = await clack.text({
      message: chalk.green('Good commit (where bug does not exist):'),
      placeholder: 'v1.0.0 or commit hash',
    });
    if (handleCancel(good)) return;
  }

  await execGitWithSpinner(`bisect start ${bad} ${good}`, {
    spinnerText: 'Starting bisect',
    successMessage: 'Bisect started',
    errorMessage: 'Failed to start bisect',
    silent: true,
  });

  // Show next step
  const result = execGit('bisect view', { silent: true });
  if (result.success && result.output) {
    console.log(chalk.cyan('\nCurrent commit to test:'));
    console.log(result.output);
    console.log(chalk.yellow('\nTest this commit, then run:'));
    console.log(chalk.gray('  gittable bisect good  (if bug is NOT present)'));
    console.log(chalk.gray('  gittable bisect bad   (if bug IS present)'));
  }
};

const markGood = async () => {
  await execGitWithSpinner('bisect good', {
    spinnerText: 'Marking commit as good',
    successMessage: 'Marked as good',
    errorMessage: 'Failed to mark as good',
    silent: true,
  });

  // Check if bisect is complete
  const result = execGit('bisect view', { silent: true });
  if (result.success && result.output) {
    console.log(chalk.cyan('\nNext commit to test:'));
    console.log(result.output);
  } else {
    // Bisect might be complete
    const logResult = execGit('bisect log', { silent: true });
    if (logResult.success) {
      const lines = logResult.output.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      if (lastLine?.includes('first bad commit')) {
        console.log(chalk.green('\n✓ Bisect complete!'));
        console.log(chalk.yellow('First bad commit found:'));
        console.log(lastLine);
      }
    }
  }
};

const markBad = async () => {
  await execGitWithSpinner('bisect bad', {
    spinnerText: 'Marking commit as bad',
    successMessage: 'Marked as bad',
    errorMessage: 'Failed to mark as bad',
    silent: true,
  });

  // Check if bisect is complete
  const result = execGit('bisect view', { silent: true });
  if (result.success && result.output) {
    console.log(chalk.cyan('\nNext commit to test:'));
    console.log(result.output);
  } else {
    // Bisect might be complete
    const logResult = execGit('bisect log', { silent: true });
    if (logResult.success) {
      const lines = logResult.output.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      if (lastLine?.includes('first bad commit')) {
        console.log(chalk.green('\n✓ Bisect complete!'));
        console.log(chalk.yellow('First bad commit found:'));
        console.log(lastLine);
      }
    }
  }
};

const resetBisect = async () => {
  const confirmed = await promptConfirm('Reset bisect session?');
  if (!confirmed) return;

  await execGitWithSpinner('bisect reset', {
    spinnerText: 'Resetting bisect',
    successMessage: 'Bisect reset',
    errorMessage: 'Failed to reset bisect',
    silent: true,
  });
};

const viewBisect = async () => {
  const result = execGit('bisect view', { silent: true });
  if (result.success && result.output) {
    console.log(result.output);
  } else {
    clack.cancel(chalk.yellow('No active bisect session'));
  }
};

module.exports = createActionRouter({
  commandName: 'BISECT',
  helpText: [
    'Binary search to find the commit that introduced a bug',
    'Available actions:',
    '  - gittable bisect start [bad] [good]',
    '  - gittable bisect good',
    '  - gittable bisect bad',
    '  - gittable bisect reset',
    '  - gittable bisect view',
  ],
  actions: [
    {
      value: 'start',
      label: chalk.green('Start bisect'),
      title: 'Start Bisect',
      handler: startBisect,
    },
    {
      value: 'good',
      label: chalk.green('Mark current commit as good'),
      title: 'Mark Good',
      handler: markGood,
    },
    {
      value: 'bad',
      label: chalk.red('Mark current commit as bad'),
      title: 'Mark Bad',
      handler: markBad,
    },
    {
      value: 'reset',
      label: chalk.yellow('Reset bisect session'),
      title: 'Reset Bisect',
      handler: resetBisect,
    },
    {
      value: 'view',
      label: chalk.cyan('View current bisect state'),
      title: 'View Bisect',
      handler: viewBisect,
    },
  ],
});
