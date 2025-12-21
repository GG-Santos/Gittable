const { execGit } = require('./executor');
const { getCache } = require('../../utils/cache');

/**
 * Get repository status (with caching)
 */
const getStatus = (useCache = true) => {
  // Try cache first
  if (useCache) {
    const statusCache = getCache('status', { ttl: 5000 }); // 5 second cache
    const cached = statusCache.get('status');
    if (cached) {
      return cached;
    }
  }

  const result = execGit('status --porcelain', { silent: true });
  if (!result.success) return null;

  const lines = result.output.trim().split('\n').filter(Boolean);
  const status = {
    staged: [],
    unstaged: [],
    untracked: [],
    ahead: 0,
    behind: 0,
    diverged: false,
  };

  for (const line of lines) {
    const staged = line[0];
    const unstaged = line[1];
    const file = line.slice(3);

    if (staged !== ' ' && staged !== '?') {
      status.staged.push({ status: staged, file });
    }
    if (unstaged !== ' ' && unstaged !== '?') {
      if (unstaged === '?') {
        status.untracked.push(file);
      } else {
        status.unstaged.push({ status: unstaged, file });
      }
    }
  }

  // Check ahead/behind
  const branchResult = execGit('rev-list --left-right --count HEAD...@{u}', { silent: true });
  if (branchResult.success) {
    const [behind, ahead] = branchResult.output.trim().split('\t').map(Number);
    status.ahead = ahead || 0;
    status.behind = behind || 0;
    status.diverged = ahead > 0 && behind > 0;
  }

  // Cache the result
  if (useCache) {
    const statusCache = getCache('status', { ttl: 5000 });
    statusCache.set('status', status);
  }

  return status;
};

module.exports = {
  getStatus,
};
