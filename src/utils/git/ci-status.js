const { execGit, getCurrentBranch } = require('../../core/git');
const { getPreference } = require('../user-preferences');

/**
 * Detect CI/CD platform from remote URL
 */
function detectCIPlatform() {
  const remoteResult = execGit('remote get-url origin', { silent: true });
  if (!remoteResult.success) {
    return null;
  }

  const remoteUrl = remoteResult.output.trim().toLowerCase();

  if (remoteUrl.includes('github.com')) {
    return 'github';
  }
  if (remoteUrl.includes('gitlab.com')) {
    return 'gitlab';
  }
  if (remoteUrl.includes('bitbucket.org')) {
    return 'bitbucket';
  }

  return null;
}

/**
 * Get CI/CD status URL
 */
function getCIStatusUrl(branch = null) {
  const platform = detectCIPlatform();
  if (!platform) {
    return null;
  }

  const currentBranch = branch || getCurrentBranch();
  if (!currentBranch) {
    return null;
  }

  const remoteResult = execGit('remote get-url origin', { silent: true });
  if (!remoteResult.success) {
    return null;
  }

  const remoteUrl = remoteResult.output.trim();

  if (platform === 'github') {
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      return `https://github.com/${owner}/${repo}/actions`;
    }
  }

  if (platform === 'gitlab') {
    const match = remoteUrl.match(/gitlab\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      return `https://gitlab.com/${owner}/${repo}/-/pipelines`;
    }
  }

  return null;
}

/**
 * Get PR/MR URL for current branch
 */
function getPRUrl(branch = null) {
  const platform = detectCIPlatform();
  if (!platform) {
    return null;
  }

  const currentBranch = branch || getCurrentBranch();
  if (!currentBranch) {
    return null;
  }

  const remoteResult = execGit('remote get-url origin', { silent: true });
  if (!remoteResult.success) {
    return null;
  }

  const remoteUrl = remoteResult.output.trim();

  if (platform === 'github') {
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      return `https://github.com/${owner}/${repo}/compare/${currentBranch}?expand=1`;
    }
  }

  if (platform === 'gitlab') {
    const match = remoteUrl.match(/gitlab\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      return `https://gitlab.com/${owner}/${repo}/-/merge_requests/new?merge_request[source_branch]=${currentBranch}`;
    }
  }

  return null;
}

module.exports = {
  detectCIPlatform,
  getCIStatusUrl,
  getPRUrl,
};
