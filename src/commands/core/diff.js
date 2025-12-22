const ui = require('../../ui/framework');
const { execGit } = require('../../core/git');
const { showCommandHeader } = require('../../utils/commands');

module.exports = async (args) => {
  showCommandHeader('DIFF', 'Show Changes');

  const staged = args.includes('--staged') || args.includes('--cached');
  const file = args.find((arg) => !arg.startsWith('--'));

  let command = 'diff';
  if (staged) {
    command += ' --staged';
  }
  if (file) {
    command += ` ${file}`;
  }

  const result = execGit(command, { silent: false });

  if (!result.success) {
    ui.error('Failed to show diff', {
      suggestion: result.error,
      exit: true,
    });
  }

  ui.success('Done');
};
