const chalk = require('chalk');
const ui = require('../../ui/framework');
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
      ui.success('Done');
    } else {
      ui.warn('No description found');
      const theme = getTheme();
      console.log(theme.dim('Try using --always to show commit hash if no tag is found'));
    }
  } else {
    ui.error('Failed to describe commit', {
      suggestion: result.error,
    });
    if (!always) {
      ui.info('Tip: Use --always to show commit hash even if no tag is found');
    }
    process.exit(1);
  }
};
