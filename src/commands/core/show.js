const chalk = require('chalk');
const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showBanner } = require('../../ui/components');
const { getTheme } = require('../../utils/ui');

module.exports = async (args) => {
  const theme = getTheme();
  showBanner('SHOW');
  console.log(`${chalk.gray('├')}  ${chalk.bold(theme.primary('Show Commit'))}`);

  const commit = args[0] || 'HEAD';

  // Check if commit exists (for HEAD or any commit)
  const checkResult = execGit(`rev-parse --verify ${commit}`, { silent: true });
  if (!checkResult.success) {
    if (commit === 'HEAD') {
      ui.error('Failed to show commit', {
        suggestion: 'No commits found in repository. Make at least one commit before using show',
        exit: true,
      });
    } else {
      ui.error('Failed to show commit', {
        suggestion: `Commit ${commit} does not exist`,
        exit: true,
      });
    }
  }

  const stat = args.includes('--stat') || args.includes('-s');
  const nameOnly = args.includes('--name-only') || args.includes('--name-status');

  let command = 'show';
  if (stat) {
    command += ' --stat';
  } else if (nameOnly) {
    command += ' --name-status';
  } else {
    command += ' --format=fuller';
  }
  command += ` ${commit}`;

  const result = execGit(command, { silent: false });

  if (!result.success) {
    ui.error('Failed to show commit', {
      suggestion: result.error,
      exit: true,
    });
  }

  ui.success('Done');
};
