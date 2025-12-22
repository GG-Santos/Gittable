const chalk = require('chalk');
const ui = require('../../ui/framework');
const { isGitRepo } = require('../../core/git');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async (args) => {
  const theme = getTheme();
  showBanner('UNINIT');
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Remove Git Repository'))}`);

  if (!isGitRepo()) {
    ui.warn('Not a git repository');
    return;
  }

  const force = args.includes('--force') || args.includes('-f');
  const gitDir = path.join(process.cwd(), '.git');

  if (!force) {
    const confirm = await ui.prompt.confirm({
      message: 'This will permanently delete all git history. Continue?',
      initialValue: false,
    });

    if (!confirm) {
      return;
    }
  }

  const spinner = ui.prompt.spinner();
  spinner.start('Removing git repository');

  try {
    // Check if .git is a file (submodule) or directory
    const gitStat = fs.statSync(gitDir);

    if (gitStat.isFile()) {
      // It's a submodule - just remove the file
      fs.unlinkSync(gitDir);
    } else if (gitStat.isDirectory()) {
      // Remove the entire .git directory
      fs.rmSync(gitDir, { recursive: true, force: true });
    }

    spinner.stop();
    ui.success('Git repository removed. You can now run "gittable init" for a fresh start.');
  } catch (error) {
    spinner.stop();
    ui.error('Failed to remove git repository', {
      suggestion: error.message,
      exit: true,
    });
  }
};
