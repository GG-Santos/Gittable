const { execGit } = require('./executor');
const { getCache } = require('../../utils/cache');

/**
 * Get list of branches (with caching)
 */
const getBranches = (useCache = true) => {
  // Try cache first
  if (useCache) {
    const branchCache = getCache('branches', { ttl: 10000 }); // 10 second cache
    const cached = branchCache.get('branches');
    if (cached) {
      return cached;
    }
  }

  const localResult = execGit('branch -vv', { silent: true });
  const remoteResult = execGit('branch -r', { silent: true });

  const branches = {
    local: [],
    remote: [],
    current: null,
  };

  if (localResult.success) {
    const localLines = localResult.output.trim().split('\n').filter(Boolean);
    for (const line of localLines) {
      const isCurrent = line.startsWith('*');
      const trimmed = line.replace(/^\*\s*/, '').trim();

      // Parse: branch-name [upstream: ahead/behind] or branch-name
      const match = trimmed.match(/^(\S+)(?:\s+\[([^\]]+)\])?/);
      if (match) {
        const name = match[1];
        const upstreamInfo = match[2] || '';

        // Extract upstream branch name (before colon or space)
        const upstreamMatch = upstreamInfo.match(/^([^:]+)/);
        const upstream = upstreamMatch ? upstreamMatch[1].trim() : null;

        if (isCurrent) {
          branches.current = name;
        }

        branches.local.push({
          name,
          current: isCurrent,
          upstream: upstream,
        });
      }
    }
  }

  if (remoteResult.success) {
    const remoteLines = remoteResult.output.trim().split('\n').filter(Boolean);
    for (const line of remoteLines) {
      const trimmed = line.trim();
      // Remove remote prefix (e.g., "origin/")
      const match = trimmed.match(/^(\S+?)\/(.+)$/);
      if (match) {
        branches.remote.push({
          name: match[2],
          remote: match[1],
        });
      }
    }
  }

  // Cache the result
  if (useCache) {
    const branchCache = getCache('branches', { ttl: 10000 });
    branchCache.set('branches', branches);
  }

  return branches;
};

module.exports = {
  getBranches,
};
