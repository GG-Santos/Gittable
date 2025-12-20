const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getCurrentBranch, remoteExists, getRemotes } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');
const { addRemote } = require('./remote');

module.exports = async (args) => {
  showBanner('PULL');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Pull from Remote')}`);

  const branch = getCurrentBranch();
  let remote = args[0] || 'origin';
  let branchName = args[1] || branch;

  // Handle empty repository (no commits = no branch)
  if (!branchName || branchName === 'null' || branchName === 'HEAD') {
    clack.cancel(chalk.red('No branch found'));
    console.log(chalk.yellow('Repository has no commits yet.'));
    console.log(chalk.gray('Make at least one commit before pulling.'));
    process.exit(1);
  }

  if (!remoteExists(remote)) {
    const remotes = getRemotes();
    if (remotes.length === 0) {
      console.log(chalk.yellow(`Remote '${remote}' does not exist.`));
      const shouldAdd = await clack.confirm({
        message: chalk.cyan(`Would you like to add remote '${remote}'?`),
        initialValue: true,
      });

      if (clack.isCancel(shouldAdd) || !shouldAdd) {
        clack.cancel(chalk.yellow('Cancelled'));
        process.exit(1);
      }

      const added = await addRemote(remote, null);
      if (!added) {
        process.exit(1);
      }
    } else {
      console.log(chalk.yellow(`Remote '${remote}' not found`));
      console.log(chalk.dim(`Available remotes: ${remotes.join(', ')}`));
      const shouldAdd = await clack.confirm({
        message: chalk.cyan(`Would you like to add remote '${remote}'?`),
        initialValue: true,
      });

      if (clack.isCancel(shouldAdd) || !shouldAdd) {
        clack.cancel(chalk.yellow('Cancelled'));
        process.exit(1);
      }

      const added = await addRemote(remote, null);
      if (!added) {
        process.exit(1);
      }
    }
  }

  const spinner = clack.spinner();
  spinner.start(`Pulling from ${remote}/${branchName}`);

  const result = execGit(`pull ${remote} ${branchName}`, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Pull completed'));
  } else {
    clack.cancel(chalk.red('Pull failed'));
    console.error(result.error);
    process.exit(1);
  }
};
