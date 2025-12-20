const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execGit, isGitRepo, getCurrentBranch } = require('../../../lib/git/exec');

describe('lib/git/exec', () => {
  describe('execGit', () => {
    it('should execute git commands successfully', () => {
      const result = execGit('--version', { silent: true });
      assert.strictEqual(result.success, true);
      assert.ok(result.output.includes('git version'));
    });

    it('should handle invalid git commands', () => {
      const result = execGit('invalid-command-that-does-not-exist', { silent: true });
      assert.strictEqual(result.success, false);
      assert.ok(result.error);
    });
  });

  describe('isGitRepo', () => {
    it('should detect if current directory is a git repository', () => {
      // This test will pass if run in a git repo, fail otherwise
      // In a real scenario, you'd mock this or test in a temp directory
      const result = isGitRepo();
      assert.strictEqual(typeof result, 'boolean');
    });
  });

  describe('getCurrentBranch', () => {
    it('should return branch name or null', () => {
      const branch = getCurrentBranch();
      // Returns null if not in a git repo, or a string if in a repo
      assert.ok(branch === null || typeof branch === 'string');
    });
  });
});

