const { showCommandHeader, execGitWithSpinner } = require('../lib/utils/command-helpers');
const { ensureRemoteExists } = require('../lib/utils/remote-helpers');

module.exports = async (args) => {
  showCommandHeader('FETCH', 'Fetch from Remote');

  let remote = args[0] || 'origin';
  const all = args.includes('--all') || args.includes('-a');
  const prune = args.includes('--prune') || args.includes('-p');

  if (!all) {
    await ensureRemoteExists(remote);
  }

  let command = 'fetch';
  if (all) {
    command += ' --all';
  } else {
    command += ` ${remote}`;
  }
  if (prune) {
    command += ' --prune';
  }

  await execGitWithSpinner(command, {
    spinnerText: `Fetching from ${all ? 'all remotes' : remote}`,
    successMessage: 'Fetch completed',
    errorMessage: 'Fetch failed',
  });
};
