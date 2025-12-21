const path = require('node:path');
const fs = require('node:fs');
const findConfig = require('find-config');

/**
 * Find the git root directory
 */
function findGitRoot(startPath = process.cwd()) {
  let current = path.resolve(startPath);
  const root = path.parse(current).root;

  while (current !== root) {
    const gitDir = path.join(current, '.git');
    if (fs.existsSync(gitDir)) {
      return current;
    }
    current = path.dirname(current);
  }

  return null;
}

/**
 * Load commitizen configuration from package.json or .czrc
 */
function loadCommitizenConfig() {
  const gitRoot = findGitRoot();
  if (!gitRoot) {
    return null;
  }

  // Try package.json first
  const packageJsonPath = path.join(gitRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (pkg.config?.commitizen) {
        return {
          path: pkg.config.commitizen.path,
          root: gitRoot,
        };
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  // Try .czrc
  const czrcPath = path.join(gitRoot, '.czrc');
  if (fs.existsSync(czrcPath)) {
    try {
      const czrc = JSON.parse(fs.readFileSync(czrcPath, 'utf8'));
      if (czrc.path) {
        return {
          path: czrc.path,
          root: gitRoot,
        };
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  return null;
}

/**
 * Resolve the adapter path
 */
function resolveAdapterPath(adapterPath, root) {
  if (!adapterPath) {
    return null;
  }

  // If it's a relative path, resolve from root
  if (adapterPath.startsWith('.')) {
    return path.resolve(root, adapterPath);
  }

  // If it's an absolute path, use as-is
  if (path.isAbsolute(adapterPath)) {
    return adapterPath;
  }

  // Otherwise, try to resolve as a module
  try {
    return require.resolve(adapterPath, { paths: [root] });
  } catch (error) {
    // If module resolution fails, try relative to root
    return path.resolve(root, adapterPath);
  }
}

/**
 * Get the prompter function from an adapter
 */
function getPrompter(adapterPath) {
  const adapter = require(adapterPath);

  // Support both CommonJS and ES modules
  if (typeof adapter === 'function') {
    return adapter;
  }

  if (adapter.prompter) {
    return adapter.prompter;
  }

  if (adapter.default && typeof adapter.default === 'function') {
    return adapter.default;
  }

  if (adapter.default?.prompter) {
    return adapter.default.prompter;
  }

  throw new Error(`Adapter at ${adapterPath} does not export a prompter function`);
}

module.exports = {
  loadCommitizenConfig,
  resolveAdapterPath,
  getPrompter,
  findGitRoot,
};
