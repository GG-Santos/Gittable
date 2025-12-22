const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit, getLog } = require('../../core/git');
const { showBanner } = require('../../ui/banner');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  showBanner('REVERT');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Revert Commit')}`);

  let commit = args[0];
  const noCommit = args.includes('--no-commit') || args.includes('-n');

  if (!commit) {
    if (!process.stdin.isTTY) {
      ui.error('Interactive mode required', {
        suggestion: 'Please provide a commit hash: gittable revert <commit>',
        exit: true,
      });
    }

    const commits = getLog(10, '%h|%s');
    if (commits.length === 0) {
      ui.warn('No commits found');
      return;
    }

    const options = commits.map((c) => ({
      value: c.hash,
      label: `${c.hash} - ${c.message}`,
    }));

    commit = await ui.prompt.select({
      message: 'Select commit to revert:',
      options,
    });

    if (commit === null) return;
  }

  const spinner = ui.prompt.spinner();
  spinner.start(`Reverting commit ${commit}`);

  let command = 'revert';
  if (noCommit) {
    command += ' --no-commit';
  }
  command += ` ${commit}`;

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    ui.success(`Reverted commit ${commit}`);
  } else {
    ui.error('Revert failed', {
      suggestion: result.error,
    });
    ui.warn('You may need to resolve conflicts manually');
    process.exit(1);
  }
};
