# Gittable Architecture Documentation

## Overview

Gittable is built with a modular, category-based architecture with clear separation of concerns. This document describes the project structure and how to work with it.

## Directory Structure

```
gittable/
├── src/
│   ├── cli/                    # CLI layer
│   │   ├── index.js           # Main CLI entry point
│   │   ├── parser.js          # Argument parsing
│   │   ├── router.js          # Command routing & execution
│   │   └── interactive.js     # Interactive menu system
│   │
│   ├── commands/              # Commands organized by category
│   │   ├── core/              # Core workflow (status, add, commit, etc.)
│   │   ├── branching/         # Branch operations (branch, merge, rebase)
│   │   ├── remote/            # Remote operations (push, pull, fetch)
│   │   ├── workflow/          # Combined workflows (quick, add-commit)
│   │   ├── history/           # History & inspection (log, show, blame)
│   │   ├── repository/        # Repository management (init, clone)
│   │   ├── utilities/         # Utility commands (help, config)
│   │   ├── base.js            # Base command helper
│   │   └── registry.js        # Command registry system
│   │
│   ├── core/                  # Core business logic
│   │   ├── git/               # Git operations (split by domain)
│   │   │   ├── executor.js    # Low-level git execution
│   │   │   ├── status.js      # Status operations
│   │   │   ├── branch.js      # Branch operations
│   │   │   ├── commit.js      # Commit operations
│   │   │   ├── remote.js      # Remote operations
│   │   │   ├── state.js       # Repository state
│   │   │   └── index.js       # Re-exports all git operations
│   │   ├── commit/            # Commit logic
│   │   │   ├── flow.js        # Main commit flow
│   │   │   ├── builder.js     # Commit message builder
│   │   │   ├── context.js     # Context-aware suggestions
│   │   │   ├── questions.js   # Commit questions/prompts
│   │   │   └── index.js       # Re-exports commit operations
│   │   ├── config/            # Configuration
│   │   │   ├── loader.js      # Config file loader
│   │   │   ├── setup.js       # Config setup wizard
│   │   │   ├── mode-filter.js # Command mode filtering
│   │   │   └── index.js       # Re-exports config operations
│   │   └── commitizen/        # Commitizen adapter
│   │
│   ├── ui/                    # UI components
│   │   ├── banner.js          # Command banners
│   │   ├── status.js          # Status display
│   │   ├── table.js           # Table formatting
│   │   └── ascii.js           # ASCII art
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── index.js           # Re-exports common utilities
│   │   ├── command-helpers.js # Common command patterns
│   │   ├── logger.js          # Logging utilities
│   │   ├── cache.js           # Caching system
│   │   └── ...                # Other utilities
│   │
│   └── types/                 # TypeScript definitions
│       └── index.d.ts
│
├── test/                      # Test suite
│   ├── unit/                  # Unit tests
│   │   ├── commands/          # Command handler tests
│   │   ├── core/              # Core module tests
│   │   └── utils/             # Utility function tests
│   ├── integration/           # Integration tests
│   │   └── cli/               # CLI integration tests
│   ├── fixtures/              # Test fixtures
│   │   └── git-repos/         # Sample git repositories
│   └── helpers/               # Test helper utilities
│       └── setup.js           # Common test setup
│
├── bin/                       # Executable scripts
│   └── git-cz.js              # Commitizen adapter entry
│
├── shell/                     # Shell integration scripts
│   ├── shellIntegration.bash
│   ├── shellIntegration.zsh
│   ├── shellIntegration.fish
│   └── shellIntegration.ps1
│
├── index.js                   # Thin entry point (re-exports from src/cli)
├── index.d.ts                 # TypeScript definitions
└── package.json
```

## Command Registration System

Commands are auto-discovered from category directories. Each category has an `index.js` that exports an array of command definitions:

```javascript
// src/commands/core/index.js
module.exports = [
  {
    name: 'status',
    aliases: ['st', 'ss'],
    description: 'Show repository status',
    category: 'coreWorkflow',
    handler: require('./status'),
  },
  // ...
];
```

### Command Interface

All commands must export a handler function with this signature:

```javascript
module.exports = async (args, context) => {
  // args: parsed command arguments
  // context: optional context object (git, config, logger, etc.)
  // Return value or throw error
};
```

### Adding a New Command

1. Create the command file in the appropriate category directory
2. Add the command definition to the category's `index.js`
3. The registry will auto-discover it on startup

Example:
```javascript
// src/commands/core/my-command.js
module.exports = async (args) => {
  // Command implementation
};

// src/commands/core/index.js
module.exports = [
  // ... existing commands
  {
    name: 'my-command',
    aliases: ['mc'],
    description: 'My new command',
    category: 'coreWorkflow',
    handler: require('./my-command'),
  },
];
```

## Core Modules

### Git Operations (`src/core/git/`)

Git operations are split by domain for better organization:

- **executor.js**: Low-level `execGit()` function and basic utilities
- **status.js**: Repository status operations
- **branch.js**: Branch listing and management
- **commit.js**: Commit log and stash operations
- **remote.js**: Remote repository operations
- **state.js**: Repository state (merge/rebase/cherry-pick)

All are re-exported from `index.js` for convenience:
```javascript
const { execGit, getStatus, getBranches } = require('../core/git');
```

### Commit Flow (`src/core/commit/`)

The commit system is organized into:

- **flow.js**: Main commit flow orchestration
- **builder.js**: Commit message building
- **context.js**: Context-aware type suggestions
- **questions.js**: Interactive prompts and questions

## CLI Layer

### Router (`src/cli/router.js`)

The router handles:
- Command resolution (name + aliases)
- Context injection
- Error handling
- Git repo validation

### Parser (`src/cli/parser.js`)

Handles:
- Argument parsing
- Flag extraction
- Command chaining (`&&`, `|`)

### Interactive Menu (`src/cli/interactive.js`)

Provides:
- Category-based command selection
- Help system integration

## Import Paths

### From Commands
```javascript
// Git operations
const { execGit, getStatus } = require('../../core/git');

// UI components
const { showBanner } = require('../../ui/banner');
const { displayStatus } = require('../../ui/status');

// Utilities
const { showCommandHeader } = require('../../utils/command-helpers');

// Other commands (use router)
const router = require('../../cli/router');
await router.execute('command-name', args);
```

### From Core/Utils
```javascript
// Git operations
const { execGit } = require('../git/executor');
const { getStatus } = require('../git/status');

// Utils
const { getCache } = require('../../utils/cache');
```

## Best Practices

1. **Use the router for command-to-command calls**: Don't directly require other commands
2. **Use domain-specific git modules**: Import from `core/git/status.js` not `core/git/executor.js` when possible
3. **Follow the command interface**: All commands should accept `(args, context)`
4. **Register in category index**: Always add commands to the category's `index.js`
5. **Use command helpers**: Leverage `src/utils/command-helpers.js` for common patterns

## Testing

The test suite uses Node.js built-in test runner (`node:test`).

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run a specific test file
node --test test/unit/commands/registry.test.js
```

### Test Structure

- **Unit tests** (`test/unit/`): Test individual functions and modules in isolation
- **Integration tests** (`test/integration/`): Test CLI commands and workflows
- **Fixtures** (`test/fixtures/`): Sample data and mock git repositories
- **Helpers** (`test/helpers/`): Common test utilities like `createTempGitRepo()`

### Testing the Registry

```javascript
const registry = require('./src/commands/registry');
registry.discoverCommands();
console.log('Commands:', registry.getAll().length);
console.log('Categories:', registry.getCategories());
```

## Index Files

Several modules provide index files for convenient imports:

```javascript
// Git operations - all in one import
const { execGit, getStatus, getBranches, getRepositoryState } = require('./src/core/git');

// Commit operations
const { commitFlow, buildCommit, promptQuestions } = require('./src/core/commit');

// Config operations
const { readConfigFile, isCommandEnabled } = require('./src/core/config');

// Common utilities
const { showCommandHeader, promptConfirm, Cache, logger } = require('./src/utils');
```
