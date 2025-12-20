const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit, remoteExists, getRemotes } = require('../lib/git/exec');
const { showBanner } = require('../lib/ui/banner');
const { addRemote } = require('./remote');

module.exports = async (args) => {
  showBanner('FETCH');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Fetch from Remote')}`);

  let remote = args[0] || 'origin';
  const all = args.includes('--all') || args.includes('-a');
  const prune = args.includes('--prune') || args.includes('-p');

  if (!all && !remoteExists(remote)) {
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
  spinner.start(`Fetching from ${all ? 'all remotes' : remote}`);

  let command = 'fetch';
  if (all) {
    command += ' --all';
  } else {
    command += ` ${remote}`;
  }
  if (prune) {
    command += ' --prune';
  }

  const result = execGit(command, { silent: false });
  spinner.stop();

  if (result.success) {
    clack.outro(chalk.green.bold('Fetch completed'));
  } else {
    clack.cancel(chalk.red('Fetch failed'));
    console.error(result.error);
    process.exit(1);
  }
};
