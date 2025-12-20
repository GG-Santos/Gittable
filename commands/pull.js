const { getCurrentBranch } = require('../lib/git/exec');
const { showCommandHeader, execGitWithSpinner } = require('../lib/utils/command-helpers');
const { ensureRemoteExists } = require('../lib/utils/remote-helpers');
const { getValidBranch } = require('../lib/utils/branch-helpers');

module.exports = async (args) => {
  showCommandHeader('PULL', 'Pull from Remote');

  const branch = getCurrentBranch();
  let remote = args[0] || 'origin';
  let branchName = args[1] || branch;

  // Validate branch exists
  branchName = getValidBranch(branchName, 'pulling');

  // Ensure remote exists (prompts to add if missing)
  await ensureRemoteExists(remote);

  // Execute pull with spinner
  await execGitWithSpinner(`pull ${remote} ${branchName}`, {
    spinnerText: `Pulling from ${remote}/${branchName}`,
    successMessage: 'Pull completed',
    errorMessage: 'Pull failed',
  });
};
