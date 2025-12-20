const clack = require('@clack/prompts');
const chalk = require('chalk');
const { getLog } = require('../lib/git/exec');
const { createTable } = require('../lib/ui/table');
const { showCommandHeader } = require('../lib/utils/command-helpers');

module.exports = async (args) => {
  showCommandHeader('LOG', 'Commit History');

  const limit = parseInt(args[0], 10) || 20;
  const format = args.includes('--oneline') ? '%h|%s' : '%h|%an|%ar|%s';

  const commits = getLog(limit, format);

  if (commits.length === 0) {
    console.log(chalk.dim('No commits found'));
    clack.outro(chalk.green.bold('Done'));
    return;
  }

  if (args.includes('--oneline')) {
    for (const commit of commits) {
      console.log(`${chalk.cyan(commit.hash)} ${commit.message}`);
    }
  } else {
    const rows = commits.map((commit) => [
      chalk.cyan(commit.hash),
      commit.author,
      chalk.gray(commit.date),
      commit.message,
    ]);

    console.log(`\n${createTable(['Hash', 'Author', 'Date', 'Message'], rows)}`);
  }

  clack.outro(chalk.green.bold('Done'));
};
