const clack = require('@clack/prompts');
const chalk = require('chalk');
const { execGit } = require('../../core/git');
const { showCommandHeader } = require('../../utils/command-helpers');
const { getTheme } = require('../../utils/color-theme');

module.exports = async (args) => {
  showCommandHeader('DESCRIBE', 'Describe Commit');

  const commit = args[0] || 'HEAD';
  const tags = args.includes('--tags') || args.includes('--all');
  const always = args.includes('--always');
  const exact = args.includes('--exact-match');
  const dirty = args.includes('--dirty');

  let command = 'describe';
  if (tags) command += ' --tags';
  if (always) command += ' --always';
  if (exact) command += ' --exact-match';
  if (dirty) command += ' --dirty';
  command += ` ${commit}`;

  const result = execGit(command, { silent: true });

  if (result.success) {
    const description = result.output.trim();
    if (description) {
      const theme = getTheme();
    console.log(chalk.bold(theme.primary(description)));
      clack.outro(chalk.green.bold('Done'));
    } else {
      clack.cancel(chalk.yellow('No description found'));
      console.log(chalk.gray('Try using --always to show commit hash if no tag is found'));
    }
  } else {
    clack.cancel(chalk.red('Failed to describe commit'));
    if (!always) {
      console.log(chalk.yellow('Tip: Use --always to show commit hash even if no tag is found'));
    }
    console.error(result.error);
    process.exit(1);
  }
};
