const { execSync } = require('node:child_process');

/**
 * Low-level Git command executor
 */
const execGit = (command, options = {}) => {
  const { silent = false, encoding = 'utf8' } = options;

  try {
    const result = execSync(`git ${command}`, {
      encoding,
      stdio: silent ? ['pipe', 'pipe', 'pipe'] : 'inherit',
      ...options,
    });
    return { success: true, output: result, error: null };
  } catch (error) {
    const stdout = error.stdout?.toString() || '';
    const stderr = error.stderr?.toString() || '';
    return {
      success: false,
      output: stdout,
      error: stderr || error.message,
    };
  }
};

/**
 * Check if we're in a git repository
 */
const isGitRepo = () => {
  const result = execGit('rev-parse --git-dir', { silent: true });
  return result.success;
};

/**
 * Get current branch name
 */
const getCurrentBranch = () => {
  const result = execGit('rev-parse --abbrev-ref HEAD', { silent: true });
  return result.success ? result.output.trim() : null;
};

module.exports = {
  execGit,
  isGitRepo,
  getCurrentBranch,
};
