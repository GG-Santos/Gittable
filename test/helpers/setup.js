/**
 * Test Setup Helpers
 *
 * Common utilities for setting up and tearing down tests
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/**
 * Create a temporary git repository for testing
 * @returns {object} Object with path and cleanup function
 */
function createTempGitRepo() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gittable-test-'));

  // Initialize git repo
  execSync('git init', { cwd: tempDir, stdio: 'pipe' });
  execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'pipe' });

  return {
    path: tempDir,
    cleanup: () => cleanupTempRepo(tempDir),
  };
}

/**
 * Create a temporary git repo with an initial commit
 * @returns {object} Object with path and cleanup function
 */
function createTempGitRepoWithCommit() {
  const repo = createTempGitRepo();

  // Create a file and commit it
  fs.writeFileSync(path.join(repo.path, 'README.md'), '# Test\n');
  execSync('git add .', { cwd: repo.path, stdio: 'pipe' });
  execSync('git commit -m "Initial commit"', { cwd: repo.path, stdio: 'pipe' });

  return repo;
}

/**
 * Clean up a temporary repository
 * @param {string} repoPath - Path to the repository
 */
function cleanupTempRepo(repoPath) {
  if (repoPath && fs.existsSync(repoPath)) {
    fs.rmSync(repoPath, { recursive: true, force: true });
  }
}

/**
 * Mock console methods for testing
 * @returns {object} Object with captured output and restore function
 */
function mockConsole() {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const captured = {
    log: [],
    error: [],
    warn: [],
  };

  console.log = (...args) => captured.log.push(args.join(' '));
  console.error = (...args) => captured.error.push(args.join(' '));
  console.warn = (...args) => captured.warn.push(args.join(' '));

  return {
    captured,
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    },
  };
}

/**
 * Create mock git execution result
 * @param {boolean} success - Whether the command succeeded
 * @param {string} output - Command output
 * @returns {object} Mock git result
 */
function createMockGitResult(success, output = '') {
  return {
    success,
    output,
    error: success ? null : output,
  };
}

/**
 * Wait for a condition to be true
 * @param {function} condition - Function that returns boolean
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} interval - Check interval in milliseconds
 * @returns {Promise<void>}
 */
async function waitFor(condition, timeout = 5000, interval = 100) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Condition not met within timeout');
}

/**
 * Run CLI command and capture output
 * @param {string} command - Command to run
 * @param {string} cwd - Working directory
 * @returns {object} Result with stdout, stderr, and exit code
 */
function runCli(command, cwd = process.cwd()) {
  const fullCommand = `node ${path.join(__dirname, '../../index.js')} ${command}`;

  try {
    const stdout = execSync(fullCommand, {
      cwd,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return {
      stdout,
      stderr: '',
      exitCode: 0,
    };
  } catch (error) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
    };
  }
}

module.exports = {
  createTempGitRepo,
  createTempGitRepoWithCommit,
  cleanupTempRepo,
  mockConsole,
  createMockGitResult,
  waitFor,
  runCli,
};
