const clack = require('@clack/prompts');
const chalk = require('chalk');
const { isGitRepo } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');
const fs = require('node:fs');
const path = require('node:path');

module.exports = async (args) => {
  showBanner('UNINIT');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Remove Git Repository')}`);

  if (!isGitRepo()) {
    clack.cancel(chalk.yellow('Not a git repository'));
    return;
  }

  const force = args.includes('--force') || args.includes('-f');
  const gitDir = path.join(process.cwd(), '.git');

  if (!force) {
    const confirm = await clack.confirm({
      message: chalk.red('This will permanently delete all git history. Continue?'),
      initialValue: false,
    });

    if (clack.isCancel(confirm) || !confirm) {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }
  }

  const spinner = clack.spinner();
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
    clack.outro(
      chalk.green.bold('Git repository removed. You can now run "gittable init" for a fresh start.')
    );
  } catch (error) {
    spinner.stop();
    clack.cancel(chalk.red('Failed to remove git repository'));
    console.error(error.message);
    process.exit(1);
  }
};



