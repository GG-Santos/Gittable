# Gittable Test Suite

This directory contains the test suite for Gittable.

## Directory Structure

```
test/
├── unit/              # Unit tests for individual modules
│   ├── commands/      # Command handler tests
│   ├── core/          # Core module tests
│   └── utils/         # Utility function tests
├── integration/       # Integration tests
│   └── cli/           # CLI integration tests
├── fixtures/          # Test fixtures and mock data
│   └── git-repos/     # Sample git repositories for testing
└── helpers/           # Test helper utilities
    └── setup.js       # Common test setup
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a specific test file
node --test test/unit/commands/registry.test.js
```

## Writing Tests

Tests use Node.js built-in test runner (`node:test`).

### Unit Test Example

```javascript
const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

describe('MyModule', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something', () => {
    const result = myFunction();
    assert.strictEqual(result, expected);
  });
});
```

### Integration Test Example

```javascript
const { describe, it } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('node:child_process');

describe('CLI Integration', () => {
  it('should run status command', () => {
    const result = execSync('node index.js status', { encoding: 'utf8' });
    assert.ok(result.includes('Status'));
  });
});
```

## Test Helpers

### `helpers/setup.js`

Common setup utilities for tests:

- `createTempGitRepo()` - Creates a temporary git repository
- `cleanupTempRepo()` - Cleans up temporary repositories
- `mockConsole()` - Mocks console output for testing

## Test Coverage

To run tests with coverage (requires Node.js 18+):

```bash
node --experimental-test-coverage --test test/**/*.test.js
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up any resources created during tests
3. **Descriptive names**: Use clear, descriptive test names
4. **Test one thing**: Each test should verify a single behavior
5. **Mock external dependencies**: Use mocks for git operations in unit tests

