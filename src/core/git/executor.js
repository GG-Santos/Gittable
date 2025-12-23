const { execSync, spawnSync } = require('node:child_process');

/**
 * Low-level Git command executor
 */
/**
 * Filter out Git CRLF/LF warnings from output
 */
function filterGitWarnings(text) {
  if (!text) return text;
  return text
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      // Filter out CRLF/LF line ending warnings
      return !trimmed.includes('CRLF will be replaced by LF') && 
             !trimmed.includes('LF will be replaced by CRLF');
    })
    .join('\n');
}

const execGit = (command, options = {}) => {
  const { silent = false, encoding = 'utf8' } = options;
  
  // If command is already an array, use it directly; otherwise split by spaces
  const args = Array.isArray(command) 
    ? command 
    : command.split(/\s+/).filter(Boolean);

  // Use spawnSync to capture stderr separately
  const result = spawnSync('git', args, {
    encoding,
    stdio: ['pipe', silent ? 'pipe' : 'inherit', 'pipe'],
    ...options,
  });

  let stdout = result.stdout?.toString() || '';
  let stderr = result.stderr?.toString() || '';
  
  // Filter out CRLF/LF warnings from stderr
  stderr = filterGitWarnings(stderr);
  
  // If there's filtered stderr and not silent, print it (but warnings are already filtered)
  if (!silent && stderr && stderr.trim()) {
    process.stderr.write(stderr);
  }
  
  // Filter warnings from stdout if in silent mode
  if (silent && stdout) {
    stdout = filterGitWarnings(stdout);
  }

  if (result.status === 0) {
    return { success: true, output: stdout, stderr: stderr, error: null };
  } else {
    return {
      success: false,
      output: stdout,
      stderr: stderr,
      error: stderr || result.error?.message || 'Command failed',
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
