/**
 * Command Registry Tests
 */

const { describe, it, beforeEach, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

// Get fresh registry instance for testing
function getRegistry() {
  // Clear require cache to get fresh instance
  const registryPath = path.resolve(__dirname, '../../../src/commands/registry.js');
  delete require.cache[registryPath];
  return require(registryPath);
}

describe('CommandRegistry', () => {
  describe('register()', () => {
    it('should register a command with name and handler', () => {
      const registry = getRegistry();

      const mockHandler = async () => {};
      registry.register({
        name: 'test-command',
        handler: mockHandler,
      });

      const cmd = registry.get('test-command');
      assert.ok(cmd, 'Command should be registered');
      assert.strictEqual(cmd.name, 'test-command');
      assert.strictEqual(cmd.handler, mockHandler);
    });

    it('should register command aliases', () => {
      const registry = getRegistry();

      const mockHandler = async () => {};
      registry.register({
        name: 'test-cmd',
        aliases: ['tc', 't'],
        handler: mockHandler,
      });

      // Should be accessible by name
      assert.ok(registry.get('test-cmd'));

      // Should be accessible by alias
      assert.ok(registry.get('tc'));
      assert.ok(registry.get('t'));

      // All should point to same command
      assert.strictEqual(registry.get('tc').name, 'test-cmd');
      assert.strictEqual(registry.get('t').name, 'test-cmd');
    });

    it('should throw error for command without name', () => {
      const registry = getRegistry();

      assert.throws(() => {
        registry.register({
          handler: async () => {},
        });
      }, /must have name and handler/);
    });

    it('should throw error for command without handler', () => {
      const registry = getRegistry();

      assert.throws(() => {
        registry.register({
          name: 'no-handler',
        });
      }, /must have name and handler/);
    });

    it('should be idempotent for same command', () => {
      const registry = getRegistry();

      const handler = async () => {};
      registry.register({ name: 'idempotent', handler });
      registry.register({ name: 'idempotent', handler });

      // Should not throw, should still work
      assert.ok(registry.get('idempotent'));
    });
  });

  describe('get()', () => {
    it('should return null for unknown command', () => {
      const registry = getRegistry();

      const cmd = registry.get('unknown-command-xyz');
      assert.strictEqual(cmd, null);
    });

    it('should return command by name', () => {
      const registry = getRegistry();

      registry.register({
        name: 'my-command',
        description: 'Test description',
        handler: async () => {},
      });

      const cmd = registry.get('my-command');
      assert.strictEqual(cmd.description, 'Test description');
    });
  });

  describe('has()', () => {
    it('should return true for registered command', () => {
      const registry = getRegistry();

      registry.register({
        name: 'exists',
        handler: async () => {},
      });

      assert.strictEqual(registry.has('exists'), true);
    });

    it('should return true for registered alias', () => {
      const registry = getRegistry();

      registry.register({
        name: 'full-name',
        aliases: ['fn'],
        handler: async () => {},
      });

      assert.strictEqual(registry.has('fn'), true);
    });

    it('should return false for unknown command', () => {
      const registry = getRegistry();

      assert.strictEqual(registry.has('not-registered'), false);
    });
  });

  describe('getAll()', () => {
    it('should return array of all registered commands', () => {
      const registry = getRegistry();

      registry.register({ name: 'cmd1', handler: async () => {} });
      registry.register({ name: 'cmd2', handler: async () => {} });

      const all = registry.getAll();
      assert.ok(Array.isArray(all));
      assert.ok(all.length >= 2);
    });
  });

  describe('getCategories()', () => {
    it('should return array of category names', () => {
      const registry = getRegistry();

      registry.register({
        name: 'cat-test',
        category: 'custom-category',
        handler: async () => {},
      });

      const categories = registry.getCategories();
      assert.ok(Array.isArray(categories));
      assert.ok(categories.includes('custom-category'));
    });
  });

  describe('discoverCommands()', () => {
    it('should auto-discover commands from category directories', () => {
      const registry = getRegistry();

      // Discover commands
      registry.discoverCommands(path.join(__dirname, '../../../src/commands'));

      // Should have discovered core commands
      assert.ok(registry.has('status'), 'Should have status command');
      assert.ok(registry.has('commit'), 'Should have commit command');
      assert.ok(registry.has('push'), 'Should have push command');
      assert.ok(registry.has('pull'), 'Should have pull command');
    });
  });
});
