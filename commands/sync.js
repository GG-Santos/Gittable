const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, getCurrentBranch, remoteExists, getRemotes } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');
const { addRemote } = require('./remote');

module.exports = async (args) => {
  showBanner('SYNC');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Synchronize Repository')}`);

  const branch = getCurrentBranch();
  let remote = args[0] || 'origin';

  // Handle empty repository (no commits = no branch)
  if (!branch || branch === 'null' || branch === 'HEAD') {
    clack.cancel(chalk.red('No branch found'));
    console.log(chalk.yellow('Repository has no commits yet.'));
    console.log(chalk.gray('Make at least one commit before synchronizing.'));
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

  // Step 1: Fetch
  let spinner = clack.spinner();
  spinner.start('Fetching from remote');
  let result = execGit(`fetch ${remote}`, { silent: true });
  spinner.stop();

  if (!result.success) {
    clack.cancel(chalk.red('Fetch failed'));
    console.error(result.error);
    process.exit(1);
  }

  // Step 2: Rebase
  spinner = clack.spinner();
  spinner.start(`Rebasing onto ${remote}/${branch}`);
  result = execGit(`rebase ${remote}/${branch}`, { silent: false });
  spinner.stop();

  if (!result.success) {
    clack.cancel(chalk.red('Rebase failed'));
    console.error(result.error);
    console.log(chalk.yellow('\nYou may need to resolve conflicts manually'));
    process.exit(1);
  }

  // Step 3: Push
  spinner = clack.spinner();
  spinner.start(`Pushing to ${remote}/${branch}`);
  result = execGit(`push ${remote} ${branch}`, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Synchronization completed'));
  } else {
    clack.cancel(chalk.red('Push failed'));
    console.error(result.error);
    process.exit(1);
  }
};
