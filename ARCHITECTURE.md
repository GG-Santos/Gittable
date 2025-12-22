# Gittable Architecture Documentation

## Overview

Gittable (`@gg-santos/gittable`) is built with a modular, category-based architecture with clear separation of concerns. The project features a unified, native prompt system integrated with Gittable's theme system, eliminating external dependencies for UI components. This document describes the project structure and how to work with it.

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
│   │   ├── workflow/          # Combined workflows (commit-push, commit-sync)
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
│   │   ├── commit/            # Commit logic (modular architecture)
│   │   │   ├── flow.js        # Main commit flow orchestration (~198 lines)
│   │   │   ├── validation.js  # Staging area validation
│   │   │   ├── execution.js   # Commit execution
│   │   │   ├── staging.js     # Interactive file staging
│   │   │   ├── preview.js     # Commit preview and editing
│   │   │   ├── post-commit.js # Post-commit hooks and notifications
│   │   │   ├── push-integration.js # Push/sync integration
│   │   │   ├── builder.js     # Commit message builder
│   │   │   ├── context.js     # Context-aware suggestions
│   │   │   ├── questions.js   # Commit questions/prompts
│   │   │   ├── cache.js       # Commit cache for retry
│   │   │   ├── get-previous-commit.js # Previous commit retrieval
│   │   │   ├── recent-messages.js # Recent commit message history
│   │   │   └── index.js       # Re-exports commit operations
│   │   ├── errors/            # Error handling system
│   │   │   └── index.js       # Custom error classes and handler
│   │   ├── constants.js        # Application constants
│   │   ├── config/            # Configuration
│   │   │   ├── loader.js      # Config file loader
│   │   │   ├── setup.js       # Config setup wizard
│   │   │   ├── mode-filter.js # Command mode filtering
│   │   │   ├── adapter-loader.js # Commitizen adapter loader
│   │   │   └── index.js       # Re-exports config operations
│   │
│   ├── ui/                    # UI system (unified native architecture)
│   │   ├── framework/         # High-level UI framework
│   │   │   ├── index.js       # Main framework entry (unified API)
│   │   │   ├── prompts.js     # Framework prompt wrappers
│   │   │   ├── messages.js    # Message system (error, warn, info, success)
│   │   │   ├── layout.js      # Layout components (banners, spacing)
│   │   │   ├── tables.js      # Table rendering
│   │   │   ├── results.js     # Result display (success, partial, failure)
│   │   │   ├── standards.js   # UI/UX standards enforcement
│   │   │   └── theme.js       # Theme system (default, dark, light, highContrast)
│   │   ├── prompts/           # Unified native prompt system (no external deps)
│   │   │   ├── index.js       # Main prompts API
│   │   │   ├── core.js        # Core prompt primitives (TextPrompt, SelectPrompt, etc.)
│   │   │   ├── text.js        # Text input prompt
│   │   │   ├── select.js      # Single select prompt
│   │   │   ├── multiselect.js # Multi-select prompt
│   │   │   ├── group-multiselect.js # Grouped multi-select
│   │   │   ├── select-key.js  # Keyboard shortcut select
│   │   │   ├── confirm.js     # Yes/No confirmation prompt
│   │   │   ├── password.js    # Password input prompt
│   │   │   ├── spinner.js     # Loading spinner
│   │   │   ├── block.js       # Block prompt (text with validation)
│   │   │   ├── helpers.js     # Helper functions (intro, outro, cancel, note, log, group)
│   │   │   └── theme.js       # Theme integration for prompts
│   │   ├── components/        # Reusable UI components
│   │   │   ├── index.js       # Component exports
│   │   │   ├── banner.js      # Command banners
│   │   │   ├── status.js      # Status display
│   │   │   └── table.js       # Table formatting
│   │   ├── banner.js          # Backward compat wrapper
│   │   ├── status.js          # Backward compat wrapper
│   │   ├── table.js           # Backward compat wrapper
│   │   └── ascii.js           # ASCII art generation
│   │
│   ├── utils/                 # Shared utilities (organized by concern)
│   │   ├── index.js           # Re-exports common utilities
│   │   ├── git/               # Git-related utilities
│   │   │   ├── git-hooks.js   # Git hooks management
│   │   │   ├── remote-helpers.js # Remote operations helpers
│   │   │   ├── branch-helpers.js # Branch operations helpers
│   │   │   ├── branch-protection.js # Branch protection checks
│   │   │   ├── ci-status.js   # CI status checks
│   │   │   └── index.js       # Barrel export
│   │   ├── ui/                # UI-related utilities
│   │   │   ├── color-theme.js # Theme system
│   │   │   ├── spinner.js     # Spinner utilities
│   │   │   ├── progress-indicator.js # Progress indicators
│   │   │   ├── prompt-helpers.js # Prompt helpers
│   │   │   ├── terminal-link.js # Terminal link utilities
│   │   │   └── index.js       # Barrel export
│   │   ├── commands/          # Command-related utilities
│   │   │   ├── command-helpers.js # Common command patterns
│   │   │   ├── command-history.js # Command history
│   │   │   ├── command-prioritizer.js # Command prioritization
│   │   │   ├── action-router.js # Action routing
│   │   │   └── index.js       # Barrel export
│   │   ├── validation/        # Validation utilities
│   │   │   ├── pre-commit-validation.js # Pre-commit validation
│   │   │   ├── error-helpers.js # Error parsing and display
│   │   │   └── index.js       # Barrel export
│   │   ├── cache/             # Caching system
│   │   │   └── index.js       # Cache implementation with TTL
│   │   ├── logger.js          # Logging utilities
│   │   ├── file-selection.js  # File selection utilities
│   │   ├── file-metadata.js  # File metadata utilities
│   │   ├── user-preferences.js # User preferences
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
│   ├── git-cz.js             # Commitizen adapter entry
│   └── git-cz.cmd             # Windows command file
│
├── scripts/                   # Build and publish scripts
│   └── publish-npm.js
│
├── index.js                   # Thin entry point (re-exports from src/cli)
├── index.d.ts                 # TypeScript definitions
├── package.json
├── biome.json                 # Biome linter/formatter config
└── README.md
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
module.exports = async (args) => {
  // args: parsed command arguments
  // Return value or throw error (no process.exit() calls)
};
```

### Adding a New Command

1. Create the command file in the appropriate category directory
2. Add the command definition to the category's `index.js`
3. The registry will auto-discover it on startup

Example:
```javascript
// src/commands/core/my-command.js
const { showCommandHeader } = require('../../utils/commands');
const { GittableError } = require('../../core/errors');

module.exports = async (args) => {
  showCommandHeader('MY-COMMAND', 'My New Command');
  
  try {
    // Command implementation
    return { success: true };
  } catch (error) {
    throw new GittableError('Command failed', 'my-command', {
      suggestion: error.message,
    });
  }
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

## UI System

### Unified Native Prompt System (`src/ui/prompts/`)

Gittable features a completely native prompt system with zero external UI dependencies. This system was built from scratch to provide:

- **Self-contained implementation**: Uses only Node.js built-ins and chalk
- **Theme integration**: Native integration with Gittable's theme system
- **Consistent API**: Unified interface for all prompt types
- **Performance**: No wrapper layers, direct implementation
- **Maintainability**: Single source of truth for all UI components

**Available Prompts:**
- `text`: Text input with validation
- `select`: Single selection from options
- `multiselect`: Multiple selections
- `group-multiselect`: Grouped multi-selection
- `select-key`: Keyboard shortcut selection
- `confirm`: Yes/No confirmation
- `password`: Password input (hidden)
- `spinner`: Loading indicator
- `block`: Multi-line text input

**Helper Functions:**
- `intro`: Display introduction message
- `outro`: Display completion message
- `cancel`: Display cancellation message
- `note`: Display informational note
- `log`: Display log message
- `group`: Group related prompts

### UI Framework (`src/ui/framework/`)

The high-level framework provides:

- **Unified API**: Single entry point for all UI operations
- **Theme System**: Automatic theme support (default, dark, light, highContrast)
- **Layout Components**: Banners, spacing, visual hierarchy
- **Message System**: Error, warning, info, success, note messages
- **Table Rendering**: Formatted tables with alignment and truncation
- **Result Display**: Success, partial, and failure result displays
- **Standards Enforcement**: UI/UX standards for consistency

**Usage:**
```javascript
const ui = require('../../ui/framework');

// Show banner
ui.layout.showBanner('COMMAND', { subtitle: 'Description' });

// Display messages
ui.error('Operation failed', { suggestion: 'Try again' });
ui.success('Operation completed');
ui.warn('Warning message');
ui.info('Info message');

// Prompts
const value = await ui.prompt.text({ message: 'Enter value' });
const selected = await ui.prompt.select({ message: 'Choose', options: [...] });

// Tables
ui.table.create({ headers: [...], rows: [...] });

// Results
ui.result.success({ message: 'Done', details: [...] });
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

The commit system is organized into modular components:

**Core Flow:**
- **flow.js**: Main commit flow orchestration (~198 lines, unified for both `gittable commit` and `git-cz`)
- **validation.js**: Staging area validation and file checks
- **execution.js**: Git commit command execution with error handling
- **staging.js**: Interactive file staging before commit
- **preview.js**: Commit message preview and editing interface
- **post-commit.js**: Post-commit hooks, notifications, and message saving
- **push-integration.js**: Push and sync flow after successful commit

**Supporting Modules:**
- **builder.js**: Commit message building with conventional format
- **context.js**: Context-aware type suggestions based on changed files
- **questions.js**: Interactive prompts and questions (uses UI framework)
- **cache.js**: Commit cache for retry functionality
- **get-previous-commit.js**: Retrieve previous commit information
- **recent-messages.js**: Recent commit message history

This modular structure replaced a monolithic 739-line `flow.js` file, making the codebase more maintainable and testable.

### Error Handling (`src/core/errors/`)

Centralized error handling system:

- **index.js**: Custom error classes and centralized error handler
  - `GittableError`: Base error class
  - `CancelledError`: User cancellation (exit code 0)
  - `ValidationError`: Validation failures
  - `GitError`: Git operation errors
  - `ConfigError`: Configuration errors
  - `CommandError`: Command execution errors

All errors include:
- Error code
- Suggestion message
- Solution command (optional)
- Exit code

**Usage:**
```javascript
const { GitError, ValidationError } = require('../../core/errors');

// Throw errors instead of process.exit()
throw new GitError('Push failed', 'push', {
  suggestion: 'Check your remote configuration',
  solution: 'gittable remote',
});
```

### Constants (`src/core/constants.js`)

Application-wide constants:
- `NO_REPO_COMMANDS`: Commands that don't require git repo
- `NO_HISTORY_COMMANDS`: Commands excluded from history
- `COMMAND_CATEGORIES`: Command category directories for auto-discovery
- `DEFAULT_REMOTE`: Default remote name
- `DEFAULT_SUBJECT_LIMIT`: Default commit subject limit
- `STATUS_CACHE_TTL`: Status cache TTL
- `RECENT_MESSAGES_LIMIT`: Recent messages to show
- `STAGED_FILES_PREVIEW_LIMIT`: Staged files preview limit
- `COMMAND_SUGGESTIONS_LIMIT`: Command suggestions limit
- `INTERACTIVE_MARKERS`: Special marker values for interactive menus (`BACK`, `DIRECT`, `CUSTOM`, `EMPTY`)

**Usage:**
```javascript
const { DEFAULT_REMOTE, NO_REPO_COMMANDS, INTERACTIVE_MARKERS } = require('../constants');
```

### Configuration (`src/core/config/`)

Configuration system includes:

- **loader.js**: Config file loader (.gittable.js, .gittable.json, package.json)
- **setup.js**: Config setup wizard
- **mode-filter.js**: Command mode filtering (basic/full)
- **adapter-loader.js**: Commitizen adapter loader for backward compatibility

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

// UI Framework (recommended for all new code)
const ui = require('../../ui/framework');
ui.layout.showBanner('COMMAND', { subtitle: 'Description' });
const value = await ui.prompt.text({ message: 'Enter value' });
ui.success('Operation completed');
ui.error('Operation failed', { suggestion: 'Try again' });

// Direct prompt access (for advanced use cases)
const prompts = require('../../ui/prompts');
const result = await prompts.text({ message: 'Enter value' });

// Components (for direct component access)
const { showBanner, displayStatus } = require('../../ui/components');

// Utilities (use organized subdirectories)
const { showCommandHeader, execGitWithSpinner } = require('../../utils/commands');
const { getTheme } = require('../../utils/ui');
const { getValidBranch } = require('../../utils/git');
const { parseGitError } = require('../../utils/validation');
const { getCache } = require('../../utils/cache');

// Or use the main utils index for convenience
const { showCommandHeader, getTheme, getCache } = require('../../utils');

// Error handling
const { GittableError, GitError, handleError } = require('../../core/errors');

// Constants
const { DEFAULT_REMOTE, NO_REPO_COMMANDS } = require('../../core/constants');

// Other commands (use router)
const router = require('../../cli/router');
await router.execute('command-name', args);
```

### From Core/Utils
```javascript
// Git operations
const { execGit } = require('../git/executor');
const { getStatus } = require('../git/status');

// Commit operations (modular)
const { commitFlow, validateStagingArea } = require('../commit');
const { hasStagedChanges } = require('../commit/validation');
const { executeCommit } = require('../commit/execution');

// Error handling
const { GitError, ValidationError, handleError } = require('../errors');

// Constants
const { DEFAULT_REMOTE, STATUS_CACHE_TTL } = require('../constants');

// Utils (organized by concern)
const { getCache } = require('../../utils/cache');
const { getTheme } = require('../../utils/ui');
const { showCommandHeader } = require('../../utils/commands');
```

## Best Practices

1. **Use the router for command-to-command calls**: Don't directly require other commands
2. **Use domain-specific git modules**: Import from `core/git/status.js` not `core/git/executor.js` when possible
3. **Follow the command interface**: All commands should accept `(args)` and return or throw
4. **Register in category index**: Always add commands to the category's `index.js`
5. **Use organized utils**: Import from `utils/commands`, `utils/ui`, `utils/git`, etc. instead of direct file paths
6. **Use error classes**: Throw `GittableError`, `GitError`, `ValidationError` instead of generic `Error`
7. **Use constants**: Import from `core/constants.js` instead of hardcoding values
8. **Avoid process.exit()**: Return exit codes or throw errors instead (CLI entry point is exception)
9. **Use UI framework**: Always use `ui = require('../../ui/framework')` for new code instead of direct prompt imports
10. **Follow UI standards**: Adhere to `src/ui/framework/standards.js` for consistent UX
11. **Theme-aware colors**: Use `getTheme()` from `utils/ui` instead of hardcoded colors

## Naming Conventions

To maintain consistency across the codebase, follow these naming conventions:

- **Files**: Use `kebab-case` for command files (e.g., `status-short.js`, `commit-push.js`), `camelCase` for utility files (e.g., `commandHelpers.js`, `fileSelection.js`)
- **Commands**: Use `kebab-case` for command names (e.g., `status-short`, `commit-push`)
- **Classes**: Use `PascalCase` (e.g., `CommandRegistry`, `GittableError`, `Router`)
- **Functions**: Use `camelCase` (e.g., `getStatus()`, `executeCommand()`, `showBanner()`)
- **Constants**: Use `UPPER_SNAKE_CASE` (e.g., `NO_REPO_COMMANDS`, `DEFAULT_REMOTE`, `STATUS_CACHE_TTL`)
- **Variables**: Use `camelCase` (e.g., `commandName`, `exitCode`, `theme`)

## Singleton Patterns

Some modules use the singleton pattern for shared state:

- **CommandRegistry** (`src/commands/registry.js`): Single registry instance for command discovery and resolution
- **Router** (`src/cli/router.js`): Single router instance for command execution

These singletons are created at module load time and shared across all imports. For testing scenarios requiring fresh instances, consider refactoring to factory functions.

## Architecture Improvements

Gittable has undergone major architectural improvements:

### Modular Commit Flow

Split monolithic 739-line `flow.js` into 6 focused modules:
- `validation.js` - Staging validation
- `execution.js` - Commit execution
- `staging.js` - Interactive file staging
- `preview.js` - Message preview/editing
- `post-commit.js` - Post-commit actions
- `push-integration.js` - Push/sync flow

**Result**: 73% reduction in main file size (739 → 198 lines)

### Organized Utils Directory

Reorganized 30+ utility files into logical subdirectories:
- `git/` - Git-related utilities (5 files)
- `ui/` - UI-related utilities (6 files)
- `commands/` - Command helpers (4 files)
- `validation/` - Validation utilities (2 files)
- `cache/` - Caching system (1 file)

**Result**: Clear organization, easier navigation, logical groupings

### Error Handling System

Created centralized error handling with:
- 6 custom error classes
- Consistent error propagation
- No `process.exit()` calls in commands
- Proper error codes and suggestions

**Result**: Testable code, proper error propagation, better error messages

### Constants Extraction

Moved magic strings to `core/constants.js`:
- 9 application constants
- Centralized configuration
- Reduced typos and inconsistencies

**Result**: Better maintainability, centralized configuration

### Import Path Migration

Updated all 65+ source files to use new organized structure:
- `utils/commands` instead of `utils/command-helpers`
- `utils/ui` instead of `utils/color-theme`
- `utils/git` instead of individual git utility files
- `utils/validation` instead of individual validation files

**Result**: Cleaner imports, better organization, easier refactoring

### Benefits

- **Maintainability**: Smaller, focused modules are easier to understand and modify
- **Testability**: No `process.exit()` calls, errors are thrown and can be caught
- **Consistency**: Standardized error handling and import patterns
- **Organization**: Clear directory structure with logical groupings
- **Type Safety**: Constants reduce magic strings and typos
- **Extensibility**: Modular structure makes it easier to add features

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

## Index Files

Several modules provide index files for convenient imports:

```javascript
// Git operations - all in one import
const { execGit, getStatus, getBranches, getRepositoryState } = require('./src/core/git');

// Commit operations
const { commitFlow, executeCommit, buildCommit, promptQuestions } = require('./src/core/commit');

// Config operations
const { readConfigFile, isCommandEnabled } = require('./src/core/config');

// UI Framework (recommended)
const ui = require('./src/ui/framework');
// Direct prompt access (advanced use cases)
const prompts = require('./src/ui/prompts');
// Component access
const components = require('./src/ui/components');

// Common utilities
const { showCommandHeader, promptConfirm, Cache, logger } = require('./src/utils');
```
