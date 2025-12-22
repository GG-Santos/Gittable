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

  // Split by newlines and filter empty lines, but preserve leading spaces
  const lines = result.output.split(/\r?\n/).filter(line => line.length > 0);
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

    // Handle staged files (first char is not space and not '?')
    // '?' in first position means untracked, which we handle separately
    if (staged !== ' ' && staged !== '?') {
      status.staged.push({ status: staged, file });
    }
    
    // Handle unstaged and untracked files
    if (unstaged !== ' ') {
      if (unstaged === '?') {
        // Untracked file (shows as ?? in porcelain format)
        status.untracked.push(file);
      } else {
        // Unstaged modification
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
