const { getCurrentBranch } = require('../lib/git/exec');
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
} = require('../lib/utils/command-helpers');
const { ensureRemoteExists } = require('../lib/utils/remote-helpers');
const { getValidBranch } = require('../lib/utils/branch-helpers');

module.exports = async (args) => {
  showCommandHeader('PUSH', 'Push to Remote');

  const branch = getCurrentBranch();
  let remote = args[0] || 'origin';
  let branchName = args[1] || branch;
  const force = args.includes('--force') || args.includes('-f');

  // Validate branch exists
  branchName = getValidBranch(branchName, 'pushing');

  // Ensure remote exists (prompts to add if missing)
  await ensureRemoteExists(remote);

  // Handle force push confirmation
  if (force) {
    requireTTY([
      'Force push requires confirmation.',
      'Please use: gittable push <remote> <branch> --force (with confirmation)',
    ]);

    const confirmed = await promptConfirm(
      'Force push? This can overwrite remote history.',
      false
    );
    if (!confirmed) return;
  }

  // Execute push with spinner
  const command = force
    ? `push ${remote} ${branchName} --force`
    : `push ${remote} ${branchName}`;

  await execGitWithSpinner(command, {
    spinnerText: `Pushing to ${remote}/${branchName}`,
    successMessage: 'Push completed',
    errorMessage: 'Push failed',
  });
};
