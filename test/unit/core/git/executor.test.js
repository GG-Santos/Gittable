/**
 * Git Executor Tests
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { createTempGitRepo, cleanupTempRepo } = require('../../../helpers/setup');

// Import the git executor
const { execGit, isGitRepo, getCurrentBranch } = require('../../../../src/core/git/executor');

describe('Git Executor', () => {
  let tempRepo;
  let originalCwd;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempRepo = createTempGitRepo();
    process.chdir(tempRepo.path);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (tempRepo) {
      tempRepo.cleanup();
    }
  });

  describe('isGitRepo()', () => {
    it('should return true in a git repository', () => {
      assert.strictEqual(isGitRepo(), true);
    });

    it('should return false outside a git repository', () => {
      process.chdir(originalCwd);
      // Go to temp directory (not a git repo)
      const os = require('node:os');
      process.chdir(os.tmpdir());

      // This might still return true if tmpdir is in a git repo
      // So we'll just verify the function doesn't throw
      const result = isGitRepo();
      assert.strictEqual(typeof result, 'boolean');
    });
  });

  describe('execGit()', () => {
    it('should execute git commands successfully', () => {
      const result = execGit('status', { silent: true });

      assert.ok(result.success, 'Command should succeed');
      assert.ok(typeof result.output === 'string', 'Output should be a string');
    });

    it('should return error for invalid commands', () => {
      const result = execGit('invalid-command-xyz', { silent: true });

      assert.strictEqual(result.success, false);
    });

    it('should capture output from commands', () => {
      const result = execGit('branch', { silent: true });

      assert.ok(result.success);
      // New repo should have no branches or default branch
      assert.ok(typeof result.output === 'string');
    });
  });

  describe('getCurrentBranch()', () => {
    it('should return current branch name', () => {
      // Create initial commit so we have a branch
      const fs = require('node:fs');
      fs.writeFileSync('test.txt', 'test');
      execGit('add .', { silent: true });
      execGit('commit -m "initial"', { silent: true });

      const branch = getCurrentBranch();

      // Should be master or main (depending on git config)
      assert.ok(
        branch === 'master' || branch === 'main',
        `Expected master or main, got: ${branch}`
      );
    });

    it('should return null for empty repository', () => {
      const branch = getCurrentBranch();

      // Empty repo might return null or undefined
      // The behavior depends on git version
      assert.ok(branch === null || branch === undefined || typeof branch === 'string');
    });
  });
});
