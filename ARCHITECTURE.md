# Gittable Architecture

## Overview

Gittable is built with a modular, category-based architecture that promotes maintainability, extensibility, and testability. The system is organized into distinct layers that handle different concerns: CLI interface, command routing, business logic, UI components, and utilities.

## Architecture Principles

1. **Separation of Concerns**: Each module has a single, well-defined responsibility
2. **Modularity**: Commands and utilities are organized into logical categories
3. **Extensibility**: New commands can be added easily through the registry system
4. **Testability**: Core logic is separated from CLI interface for easy testing
5. **Consistency**: Standardized patterns for commands, UI, and error handling

## System Layers

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Layer                            │
│  (Entry Point, Argument Parsing, Command Routing)      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Command Layer                          │
│  (Command Registry, Command Handlers, Categories)       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Core Layer                            │
│  (Commit Flow, Git Operations, Configuration, Errors)  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    UI Layer                             │
│  (Prompts, Components, Framework, Theme)                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Utilities Layer                       │
│  (Helpers, Cache, Validation, File Operations)         │
└─────────────────────────────────────────────────────────┘
```

## Layer Details

### CLI Layer (`src/cli/`)

The CLI layer handles user interaction, argument parsing, and command routing.

#### Components

- **`index.js`**: Main entry point
  - Initializes the CLI
  - Handles global flags (--verbose, --dry-run)
  - Routes to interactive menu or command execution
  - Manages exit codes

- **`parser.js`**: Argument parsing
  - Parses command-line arguments
  - Extracts command name and arguments
  - Handles command chaining (&&, |)
  - Detects help and version flags

- **`router.js`**: Command routing
  - Resolves command names to handlers
  - Executes commands with error handling
  - Manages command chains
  - Validates Git repository requirements
  - Handles command history

- **`interactive.js`**: Interactive menus
  - Category-based command selection
  - Interactive command discovery
  - Help system integration

#### Flow

```
User Input → Parser → Router → Command Handler
                ↓
         Interactive Menu (if no args)
```

### Command Layer (`src/commands/`)

Commands are organized by category and auto-discovered by the registry.

#### Command Categories

1. **Core** (`core/`): Essential Git operations
   - `status`, `add`, `commit`, `diff`, `log`, `show`, `info`

2. **Branching** (`branching/`): Branch management
   - `branch`, `checkout`, `switch`, `merge`, `rebase`, `cherry-pick`
   - `branch-clean`, `branch-rename`, `branch-compare`

3. **Remote** (`remote/`): Remote repository operations
   - `push`, `pull`, `fetch`, `sync`, `remote`, `create-pr`

4. **Workflow** (`workflow/`): Combined operations
   - `quick`, `add-commit`, `commit-push`, `commit-sync`

5. **History** (`history/`): Repository history
   - `blame`, `grep`, `describe`, `shortlog`, `range-diff`

6. **Repository** (`repository/`): Repository management
   - `init`, `clone`, `uninit`, `archive`, `worktree`, `submodule`

7. **Utilities** (`utilities/`): Helper commands
   - `stash`, `tag`, `clean`, `restore`, `config`, `theme`, `hooks`

#### Command Structure

Each command follows a standard structure:

```javascript
{
  name: 'command-name',
  aliases: ['alias1', 'alias2'],
  description: 'Command description',
  category: 'utilities',
  subcategory: 'optional',
  handler: async (args, context) => {
    // Command implementation
  },
}
```

#### Command Registry (`registry.js`)

- Auto-discovers commands from category directories
- Registers commands and aliases
- Provides command lookup and filtering
- Supports command enable/disable via configuration

### Core Layer (`src/core/`)

The core layer contains business logic and fundamental operations.

#### Commit Module (`commit/`)

Handles the complete commit flow:

- **`flow.js`**: Main commit flow orchestration
- **`questions.js`**: Interactive commit questions
- **`builder.js`**: Builds commit message from answers
- **`context.js`**: Context-aware suggestions
- **`validation.js`**: Validates staging area and commit message
- **`execution.js`**: Executes Git commit
- **`preview.js`**: Shows commit preview
- **`staging.js`**: Handles file staging
- **`post-commit.js`**: Post-commit hooks and actions
- **`push-integration.js`**: Push integration after commit

#### Git Module (`git/`)

Wraps Git operations with error handling:

- **`executor.js`**: Low-level Git command execution
- **`branch.js`**: Branch operations
- **`commit.js`**: Commit operations
- **`remote.js`**: Remote operations
- **`status.js`**: Status operations
- **`state.js`**: Repository state detection

#### Config Module (`config/`)

Configuration management:

- **`loader.js`**: Loads configuration from files
- **`setup.js`**: First-time setup wizard
- **`mode-filter.js`**: Command filtering based on config

#### Errors Module (`errors/`)

Centralized error handling:

- **`index.js`**: Error classes and handlers
  - `ConfigError`: Configuration errors
  - `GitError`: Git operation errors
  - `ValidationError`: Validation errors
  - `CancelledError`: User cancellation

### UI Layer (`src/ui/`)

The UI layer provides consistent, beautiful user interfaces.

#### Prompts (`prompts/`)

Interactive prompt system:

- **`core.js`**: Core prompt functionality
- **`text.js`**: Text input prompts
- **`select.js`**: Select prompts
- **`multiselect.js`**: Multi-select prompts
- **`confirm.js`**: Confirmation prompts
- **`password.js`**: Password input
- **`spinner.js`**: Loading spinners
- **`theme.js`**: Theme-aware prompts

#### Components (`components/`)

Reusable UI components:

- **`banner.js`**: Command banners
- **`status.js`**: Status displays
- **`table.js`**: Table displays
- **`index.js`**: Component exports

#### Framework (`framework/`)

UI framework and standards:

- **`layout.js`**: Layout management and banners
- **`theme.js`**: Theme system
- **`messages.js`**: Message formatting
- **`prompts.js`**: Prompt utilities
- **`results.js`**: Result display
- **`standards.js`**: UI standards and constants
- **`tables.js`**: Table utilities

### Utilities Layer (`src/utils/`)

Shared utilities used across the application.

#### Command Helpers (`commands/`)

- **`command-helpers.js`**: Command execution helpers
- **`action-router.js`**: Action routing
- **`command-history.js`**: Command history management
- **`command-prioritizer.js`**: Command prioritization

#### Git Helpers (`git/`)

- **`branch-helpers.js`**: Branch utility functions
- **`branch-protection.js`**: Branch protection checks
- **`remote-helpers.js`**: Remote utility functions
- **`git-hooks.js`**: Git hooks integration
- **`ci-status.js`**: CI/CD status detection

#### File Operations

- **`file-selection.js`**: File selection utilities
- **`file-metadata.js`**: File metadata display

#### Validation (`validation/`)

- **`error-helpers.js`**: Error parsing and display
- **`pre-commit-validation.js`**: Pre-commit validation

#### UI Utilities (`ui/`)

- **`color-theme.js`**: Color theme management
- **`progress-indicator.js`**: Progress indicators
- **`prompt-helpers.js`**: Prompt helper functions
- **`spinner.js`**: Spinner utilities
- **`terminal-link.js`**: Terminal link generation

#### Other Utilities

- **`cache/`**: Caching system
- **`logger.js`**: Logging utilities
- **`versions.js`**: Version management
- **`user-preferences.js`**: User preferences
- **`verbose-mode.js`**: Verbose mode
- **`dry-run-mode.js`**: Dry-run mode
- **`fuzzy-search.js`**: Fuzzy search
- **`list-pagination.js`**: List pagination
- **`list-search.js`**: List search
- **`parallel-ops.js`**: Parallel operations
- **`table-sort.js`**: Table sorting
- **`backup-helpers.js`**: Backup utilities
- **`commit-templates.js`**: Commit templates
- **`issue-tracker.js`**: Issue tracker integration

## Data Flow

### Command Execution Flow

```
1. User Input
   ↓
2. CLI Parser (parse arguments)
   ↓
3. Router (resolve command)
   ↓
4. Command Handler (execute command)
   ↓
5. Core Logic (business logic)
   ↓
6. Git Operations (execute Git commands)
   ↓
7. UI Feedback (show results)
   ↓
8. Exit
```

### Commit Flow

```
1. commitFlow()
   ↓
2. validateStagingArea()
   ↓
3. handleUnstagedFiles() (if needed)
   ↓
4. promptQuestions() (interactive prompts)
   ↓
5. buildCommit() (build message)
   ↓
6. showCommitPreview() (preview)
   ↓
7. executeCommit() (execute Git commit)
   ↓
8. runPostCommitActions() (hooks, notifications)
   ↓
9. handlePushIntegration() (suggest push)
```

## Design Patterns

### Singleton Pattern

Used for:
- **Router**: Single routing instance
- **Command Registry**: Single command registry
- **Cache**: Shared cache instances

### Factory Pattern

Used for:
- **Command Creation**: Commands created from definitions
- **Error Creation**: Error objects created with context

### Strategy Pattern

Used for:
- **Git Operations**: Different strategies for different operations
- **UI Themes**: Different theme implementations
- **Command Execution**: Different execution strategies

### Observer Pattern

Used for:
- **Command History**: Track command execution
- **Post-commit Hooks**: Execute after commits

## Error Handling

### Error Hierarchy

```
Error
├── ConfigError (configuration issues)
├── GitError (Git operation failures)
├── ValidationError (validation failures)
└── CancelledError (user cancellation)
```

### Error Flow

1. Error occurs in command handler
2. Error caught by router
3. Error passed to error handler
4. Error handler:
   - Parses error
   - Displays user-friendly message
   - Suggests solutions
   - Returns exit code

## Configuration System

### Configuration Loading

1. Check for `.gittable.js`
2. Check for `.gittable.json`
3. Check for `package.json` (gittable key)
4. Use defaults if none found

### Configuration Structure

```javascript
{
  types: [...],              // Commit types
  scopes: [...],             // Scopes
  allowTicketNumber: boolean,
  ticketNumberPrefix: string,
  subjectLimit: number,
  allowBreakingChanges: [...],
  skipQuestions: [...],
  enabledCommands: [...],     // Command filtering
}
```

## Testing Architecture

### Test Structure

```
test/
├── unit/           # Unit tests
│   ├── commands/   # Command tests
│   └── core/       # Core logic tests
├── integration/    # Integration tests
│   └── cli/        # CLI tests
└── fixtures/       # Test fixtures
    └── git-repos/  # Test Git repositories
```

### Testing Strategy

- **Unit Tests**: Test individual functions and modules
- **Integration Tests**: Test command execution end-to-end
- **Fixtures**: Provide test data and Git repositories

## Performance Considerations

### Caching

- **Status Cache**: Caches repository status (5s TTL)
- **Config Cache**: Caches configuration
- **Command Cache**: Caches command lookups

### Lazy Loading

- Commands loaded on demand
- UI components loaded when needed
- Utilities imported as needed

### Parallel Operations

- Fetch from multiple remotes in parallel
- Batch Git operations where possible

## Extension Points

### Adding New Commands

1. Create command file in appropriate category
2. Export command definition
3. Register in category index
4. Command auto-discovered by registry

### Adding New UI Components

1. Create component in `src/ui/components/`
2. Export from `src/ui/components/index.js`
3. Use in commands

### Adding New Git Operations

1. Add to `src/core/git/`
2. Export from `src/core/git/index.js`
3. Use in commands

## Security Considerations

### Input Validation

- All user input validated
- Git command arguments sanitized
- File paths validated

### Branch Protection

- Warnings for protected branches
- Confirmation for destructive operations
- Backup before destructive operations

### Error Information

- User-friendly error messages
- No sensitive information in errors
- Detailed errors in verbose mode only

## Future Enhancements

### Potential Improvements

1. **Plugin System**: Allow third-party commands
2. **Configuration UI**: Interactive configuration editor
3. **Command Aliases**: User-defined command aliases
4. **Workflow Builder**: Visual workflow builder
5. **Integration API**: Programmatic API for integrations

## Conclusion

Gittable's architecture is designed for:
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add new features
- **Testability**: Core logic separated from UI
- **Performance**: Efficient caching and lazy loading
- **User Experience**: Consistent, beautiful interface

The modular design allows for easy extension and maintenance while providing a solid foundation for future enhancements.

