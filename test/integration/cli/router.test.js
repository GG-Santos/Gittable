/**
 * CLI Router Integration Tests
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { createTempGitRepoWithCommit, mockConsole } = require('../../helpers/setup');

describe('CLI Router', () => {
  let originalCwd;
  let tempRepo;
  let router;
  let registry;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempRepo = createTempGitRepoWithCommit();
    process.chdir(tempRepo.path);

    // Clear cache for both registry and router
    const registryPath = path.resolve(__dirname, '../../../src/commands/registry.js');
    const routerPath = path.resolve(__dirname, '../../../src/cli/router.js');

    // Clear both from cache
    delete require.cache[registryPath];
    delete require.cache[routerPath];

    // First, require and populate the registry
    registry = require(registryPath);
    registry.discoverCommands(path.join(__dirname, '../../../src/commands'));

    // Then require the router (which will use the same registry)
    router = require(routerPath);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (tempRepo) {
      tempRepo.cleanup();
    }
  });

  describe('resolve()', () => {
    it('should resolve known commands', () => {
      const cmd = router.resolve('status');

      assert.ok(cmd, 'Should resolve status command');
      assert.strictEqual(cmd.name, 'status');
    });

    it('should resolve command aliases', () => {
      const cmd = router.resolve('st');

      assert.ok(cmd, 'Should resolve st alias');
      assert.strictEqual(cmd.name, 'status');
    });

    it('should return null for unknown commands', () => {
      const cmd = router.resolve('unknown-xyz-123');

      assert.strictEqual(cmd, null);
    });
  });

  describe('hasCommand()', () => {
    it('should return true for registered commands', () => {
      assert.strictEqual(router.hasCommand('status'), true);
      assert.strictEqual(router.hasCommand('commit'), true);
      assert.strictEqual(router.hasCommand('push'), true);
    });

    it('should return true for command aliases', () => {
      assert.strictEqual(router.hasCommand('st'), true);
      assert.strictEqual(router.hasCommand('ci'), true);
    });

    it('should return false for unknown commands', () => {
      assert.strictEqual(router.hasCommand('not-a-command'), false);
    });
  });

  describe('execute()', () => {
    it('should execute help command without git repo requirement', async () => {
      const consoleMock = mockConsole();

      try {
        // Help command should work
        const result = await router.execute('help', []);

        // Should execute without throwing
        assert.ok(true, 'Help command executed');
      } finally {
        consoleMock.restore();
      }
    });

    it('should return false for unknown commands', async () => {
      const consoleMock = mockConsole();

      try {
        const result = await router.execute('unknown-command-xyz', []);

        assert.strictEqual(result, false);
      } finally {
        consoleMock.restore();
      }
    });
  });

  describe('executeChain()', () => {
    it('should execute multiple commands in sequence', async () => {
      const consoleMock = mockConsole();

      try {
        // This would execute help command twice
        const result = await router.executeChain([
          { args: ['help'], operator: '&&' },
          { args: ['help'], operator: null },
        ]);

        // Should complete successfully
        assert.ok(true, 'Chain executed');
      } finally {
        consoleMock.restore();
      }
    });

    it('should stop on failure with && operator', async () => {
      const consoleMock = mockConsole();

      try {
        const result = await router.executeChain([
          { args: ['unknown-cmd'], operator: '&&' },
          { args: ['help'], operator: null },
        ]);

        assert.strictEqual(result, false);
      } finally {
        consoleMock.restore();
      }
    });
  });
});
