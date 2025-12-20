const { execSync } = require('node:child_process');

/**
 * Execute a git command and return the output
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

/**
 * Get repository status
 */
const getStatus = () => {
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

  return status;
};

/**
 * Get list of branches
 */
const getBranches = () => {
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

  return branches;
};

/**
 * Get commit log
 */
const getLog = (limit = 20, format = '%h|%an|%ar|%s') => {
  const result = execGit(`log --format="${format}" -n ${limit}`, { silent: true });
  if (!result.success) return [];

  return result.output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, author, date, ...messageParts] = line.split('|');
      return {
        hash,
        author,
        date,
        message: messageParts.join('|'),
      };
    });
};

/**
 * Get stash list
 */
const getStashList = () => {
  const result = execGit('stash list --format="%gd|%ar|%gs"', { silent: true });
  if (!result.success) return [];

  return result.output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|');
      const ref = parts[0] || '';
      const date = parts[1] || '';
      const message = parts.slice(2).join('|') || '';
      return {
        ref,
        date,
        message,
      };
    });
};

/**
 * Check if a remote exists
 */
const remoteExists = (remoteName = 'origin') => {
  const result = execGit(`remote get-url ${remoteName}`, { silent: true });
  return result.success;
};

/**
 * Get list of remotes
 */
const getRemotes = () => {
  const result = execGit('remote', { silent: true });
  if (!result.success) return [];
  return result.output.trim().split('\n').filter(Boolean);
};

module.exports = {
  execGit,
  isGitRepo,
  getCurrentBranch,
  getStatus,
  getBranches,
  getLog,
  getStashList,
  remoteExists,
  getRemotes,
};
