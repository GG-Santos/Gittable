const ui = require('../../ui/framework');
const {
  showCommandHeader,
  execGitWithSpinner,
  promptConfirm,
} = require('../../utils/commands');

module.exports = async (args) => {
  showCommandHeader('RM', 'Remove Files');

  const files = args.filter((arg) => !arg.startsWith('--'));
  const cached = args.includes('--cached') || args.includes('--staged');
  const force = args.includes('--force') || args.includes('-f');
  const recursive = args.includes('--recursive') || args.includes('-r');

  if (files.length === 0) {
    ui.warn('No files specified');
    return;
  }

  if (!force) {
    const confirmed = await promptConfirm(`Remove ${files.length} file(s) from git?`, false);
    if (!confirmed) return;
  }

  let command = 'rm';
  if (cached) {
    command += ' --cached';
  }
  if (force) {
    command += ' --force';
  }
  if (recursive) {
    command += ' --recursive';
  }
  command += ` ${files.join(' ')}`;

  await execGitWithSpinner(command, {
    spinnerText: `Removing ${files.length} file(s)`,
    successMessage: `Removed ${files.length} file(s)`,
    errorMessage: 'Failed to remove files',
  });
};
