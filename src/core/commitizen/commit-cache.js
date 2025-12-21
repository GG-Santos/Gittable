const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/**
 * Get the cache directory for commitizen
 */
function getCacheDirectory() {
  const cacheDir = path.join(os.tmpdir(), 'commitizen');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return cacheDir;
}

/**
 * Get cache file path for a repository
 */
function getCacheFilePath(gitRoot) {
  // Use a hash of the git root path as the cache key
  const crypto = require('node:crypto');
  const hash = crypto.createHash('md5').update(gitRoot).digest('hex');
  return path.join(getCacheDirectory(), `commit-${hash}.json`);
}

/**
 * Save commit data to cache
 */
function saveCommitCache(gitRoot, data) {
  try {
    const cachePath = getCacheFilePath(gitRoot);
    const cacheData = {
      gitRoot,
      timestamp: Date.now(),
      ...data,
    };
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf8');
    return true;
  } catch (error) {
    // Silently fail - cache is optional
    return false;
  }
}

/**
 * Load commit data from cache
 */
function loadCommitCache(gitRoot) {
  try {
    const cachePath = getCacheFilePath(gitRoot);
    if (!fs.existsSync(cachePath)) {
      return null;
    }

    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));

    // Verify it's for the same repository
    if (cacheData.gitRoot !== gitRoot) {
      return null;
    }

    // Cache expires after 24 hours
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - cacheData.timestamp > maxAge) {
      return null;
    }

    return cacheData;
  } catch (error) {
    return null;
  }
}

/**
 * Clear commit cache for a repository
 */
function clearCommitCache(gitRoot) {
  try {
    const cachePath = getCacheFilePath(gitRoot);
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

module.exports = {
  saveCommitCache,
  loadCommitCache,
  clearCommitCache,
  getCacheDirectory,
};
