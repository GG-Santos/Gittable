const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit, getStatus } = require('../../core/git');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  const theme = getTheme();
  showBanner('CLEAN');
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Clean Untracked Files'))}`);

  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const force = args.includes('--force') || args.includes('-f');
  const directories = args.includes('--dir') || args.includes('-d');
  const interactive = args.includes('--interactive') || args.includes('-i');

  const status = getStatus();
  if (!status) {
    ui.error('Failed to get repository status', { exit: true });
  }

  if (status.untracked.length === 0) {
    ui.warn('No untracked files to clean');
    return;
  }

  if (dryRun) {
    ui.warn('Files that would be removed:');
    for (const file of status.untracked) {
      console.log(chalk.gray(`  ${file}`));
    }
    ui.success('Dry run complete');
    return;
  }

  if (!force && !interactive) {
    const confirm = await ui.prompt.confirm({
      message: `Remove ${status.untracked.length} untracked file(s)?`,
      initialValue: false,
    });

    if (!confirm) {
      return;
    }
  }

  const spinner = ui.prompt.spinner();
  spinner.start('Cleaning untracked files');

  let command = 'clean';
  if (force) {
    command += ' -f';
  }
  if (directories) {
    command += ' -d';
  }
  if (interactive) {
    command += ' -i';
  }

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    ui.success('Clean completed');
  } else {
    ui.error('Clean failed', {
      suggestion: result.error,
      exit: true,
    });
  }
};
