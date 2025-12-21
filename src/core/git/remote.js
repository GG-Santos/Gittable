const { execGit } = require('./executor');
const { getCache } = require('../../utils/cache');

/**
 * Check if a remote exists
 */
const remoteExists = (remoteName = 'origin') => {
  const result = execGit(`remote get-url ${remoteName}`, { silent: true });
  return result.success;
};

/**
 * Get list of remotes (with caching)
 */
const getRemotes = (useCache = true) => {
  // Try cache first
  if (useCache) {
    const remoteCache = getCache('remotes', { ttl: 10000 }); // 10 second cache
    const cached = remoteCache.get('remotes');
    if (cached) {
      return cached;
    }
  }

  const result = execGit('remote', { silent: true });
  if (!result.success) {
    const empty = [];
    if (useCache) {
      const remoteCache = getCache('remotes', { ttl: 10000 });
      remoteCache.set('remotes', empty);
    }
    return empty;
  }

  const remotes = result.output.trim().split('\n').filter(Boolean);

  // Cache the result
  if (useCache) {
    const remoteCache = getCache('remotes', { ttl: 10000 });
    remoteCache.set('remotes', remotes);
  }

  return remotes;
};

module.exports = {
  remoteExists,
  getRemotes,
};
