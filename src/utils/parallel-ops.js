/**
 * Execute multiple operations in parallel
 */
async function executeParallel(operations) {
  const results = await Promise.allSettled(operations.map((op) => op()));

  return results.map((result, index) => ({
    index,
    success: result.status === 'fulfilled',
    value: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null,
  }));
}

/**
 * Fetch from multiple remotes in parallel
 */
async function fetchFromMultipleRemotes(remotes) {
  const { execGit } = require('../core/git');

  const operations = remotes.map((remote) => () => {
    const result = execGit(`fetch ${remote}`, { silent: true });
    return { remote, result };
  });

  return executeParallel(operations);
}

/**
 * Check multiple branch statuses in parallel
 */
async function checkMultipleBranchStatuses(branches) {
  const { execGit } = require('../core/git');

  const operations = branches.map((branch) => () => {
    const result = execGit(`rev-list --left-right --count HEAD...${branch}`, { silent: true });
    return { branch, result };
  });

  return executeParallel(operations);
}

module.exports = {
  executeParallel,
  fetchFromMultipleRemotes,
  checkMultipleBranchStatuses,
};
