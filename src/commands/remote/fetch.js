const clack = require('@clack/prompts');
const chalk = require('chalk');
const { showCommandHeader, execGitWithSpinner } = require('../../utils/command-helpers');
const { ensureRemoteExists } = require('../../utils/remote-helpers');

module.exports = async (args) => {
  showCommandHeader('FETCH', 'Fetch from Remote');

  const remote = args[0] || 'origin';
  const all = args.includes('--all') || args.includes('-a');
  const prune = args.includes('--prune') || args.includes('-p');

  if (!all) {
    await ensureRemoteExists(remote);
  }

  // If fetching all remotes, use parallel operations
  if (all) {
    const { getRemotes } = require('../../core/git');
    const { fetchFromMultipleRemotes } = require('../../utils/parallel-ops');
    const remotes = getRemotes();

    if (remotes.length > 1) {
      clack.note(`Fetching from ${remotes.length} remotes in parallel`, chalk.dim('Parallel'));

      const results = await fetchFromMultipleRemotes(remotes);
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      if (successful > 0) {
        clack.note(`Fetched from ${successful} remote(s)`, chalk.green('Success'));
      }

      if (failed > 0) {
        clack.cancel(chalk.yellow(`Failed to fetch from ${failed} remote(s)`));
      }

      if (prune) {
        await execGitWithSpinner('fetch --all --prune', {
          spinnerText: 'Pruning remote branches',
          successMessage: 'Prune completed',
          errorMessage: 'Prune failed',
        });
      }

      return;
    }
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
