# Gittable

<div align="center">

**A modern, interactive Git CLI wrapper with conventional commits**

[![forthebadge](https://img.shields.io/badge/NPM-PUBLISHED-ff4d4d?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/gittable)
[![forthebadge](https://img.shields.io/badge/MADE%20WITH-JAVASCRIPT-ff4d4d?style=for-the-badge&logo=javascript&logoColor=white)](https://www.npmjs.com/package/gittable)
[![forthebadge](https://img.shields.io/badge/BUILT%20FOR-DEVELOPERS-ff4d4d?style=for-the-badge&logo=git&logoColor=white)](https://github.com/GG-Santos/Gittable)

[Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation)

</div>

---

Gittable (`@gg-santos/gittable`) provides a beautiful, user-friendly interface for common Git operations while maintaining full compatibility with standard Git commands. Built with a unified, native prompt system (no external UI dependencies) integrated with Gittable's theme system, Gittable enforces conventional commit message formats and offers intelligent, context-aware suggestions.

## Features

- **Native Prompt System** - Beautiful, intuitive command-line interface with zero external UI dependencies
- **Unified UI Framework** - Consistent theming, layouts, and components across all commands
- **Conventional Commits** - Enforces conventional commit message format for better project history
- **Full Git Coverage** - Wraps all major Git commands with enhanced user experience
- **Smart Defaults** - Context-aware suggestions and shortcuts for common workflows
- **Combined Commands** - Workflow shortcuts like `commit-push` and `commit-sync`
- **Smart Suggestions** - Context-aware next-step prompts after each command
- **Context-Aware Commits** - Auto-suggests commit types based on changed files
- **Enhanced Error Messages** - Actionable error messages with suggested solutions
- **Safety Features** - Branch protection warnings, backup before destructive operations
- **Interactive Tutorial** - Learn Git workflows with guided tutorials
- **Beautiful UI** - Colorful banners, tables, and status displays for better readability
- **Theme Support** - Multiple themes (default, dark, light, highContrast) with automatic detection
- **Fast & Lightweight** - Minimal dependencies, maximum performance
- **Commitizen Compatible** - Built-in git-cz implementation for backward compatibility with Commitizen adapters
- **Modular Architecture** - Well-organized, category-based command structure for easy extension

## Installation

### Global Installation

Install Gittable globally to use it from any directory:

```bash
npm install -g gittable
```

### Local Installation

Install Gittable as a development dependency in your project:

```bash
npm install --save-dev gittable
```

### Using npx

Run Gittable without installation using npx:

```bash
npx gittable <command>
```

## Quick Start

### Interactive Mode

Simply run `gittable` without any arguments to enter interactive mode:

```bash
gittable
```

This will display a beautiful menu to select commands by category, making it easy to discover and use available features.

### Command Mode

Use Gittable just like Git, but with enhanced prompts:

```bash
# Check repository status
gittable status
gittable st

# Create a commit with conventional format
gittable commit
gittable ci

# Branch management
gittable branch
gittable br

# Pull and push operations
gittable pull
gittable push
```

## Available Commands

### Core Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `status` | `st`, `s` | Show repository status with color-coded display |
| `info` | | Quick repository overview (branch, changes, remote status) |
| `branch` | `br`, `co` | Branch management (list, create, checkout, delete) |
| `commit` | `ci`, `save` | Create commits with conventional format (includes staging, preview, and push/sync options) |
| `pull` | `pl`, `down` | Fetch and merge from remote (use `--rebase` for rebase instead of merge) |
| `push` | `ps`, `up` | Push to remote repository |
| `sync` | | Synchronize (pull + rebase + push) |
| `merge` | | Merge branches with interactive prompts |
| `rebase` | | Rebase operations with safety checks |
| `stash` | | Stash management (list, apply, drop) |
| `log` | | View commit history with formatted output |
| `undo` | `reset` | Undo operations and reflog browser |

### Combined Workflow Commands ⚡

> **Note**: These commands are now integrated into the main `commit` command. They are kept for backward compatibility but `gittable commit` now handles all these workflows automatically.

| Command | Aliases | Description |
|---------|---------|-------------|
| `commit-push` | `cp` | Commit and push in one flow (deprecated: use `commit`) |
| `commit-sync` | `cs` | Commit and sync (deprecated: use `commit` and select sync) |
| `pull-rebase` | `pr` | Pull and rebase (deprecated: use `pull --rebase`) |

### File Operations

| Command | Description |
|---------|-------------|
| `add` | Stage files for commit with interactive selection |
| `diff` | Show changes with formatted output |
| `checkout` | Checkout files or branches |
| `restore` | Restore files from index or commit |
| `rm` | Remove files from git tracking |
| `mv` | Move/rename files in git |
| `clean` | Remove untracked files with confirmation |

### Batch Operations

| Command | Description |
|---------|-------------|
| `stash-all` | Stash all changes including untracked files |

### Branch Management Enhancements

| Command | Description |
|---------|-------------|
| `branch-clean` | Delete merged branches interactively |
| `branch-rename` | Rename branch locally and remotely |
| `branch-compare` | Show differences between two branches |

### Tag Management Enhancements

| Command | Description |
|---------|-------------|
| `tag-push` | Create and push tag in one flow |
| `tag-delete` | Delete tag locally and remotely |

### Conflict Resolution

| Command | Description |
|---------|-------------|
| `conflicts` | List all conflicted files |
| `resolve` | Open conflicted file in editor and stage after resolution |
| `merge-continue` | Continue merge after resolving conflicts |
| `merge-abort` | Abort merge operation |

### Pattern and Preview Commands

| Command | Description |
|---------|-------------|
| `add-pattern` | Stage files matching a pattern (e.g., *.js, src/**/*.ts) |
| `diff-preview` | Preview changes before committing |

### Remote Management Enhancements

| Command | Description |
|---------|-------------|
| `remote-set-url` | Update remote URL interactively |

### Help System

| Command | Description |
|---------|-------------|
| `help` | Show detailed help for specific command |
| `help <command>` | Get help for a specific command with examples |
| `examples` | Show usage examples for common workflows |
| `tutorial` | Interactive walkthrough of common Git workflows |
| `<command> --help` | Show help for any command |

### Command History

| Command | Description |
|---------|-------------|
| `history` | Show recent commands executed |
| `history <n>` | Show last N commands (default: 20) |
| `history --clear` | Clear command history |

### Git Hooks Integration

| Command | Description |
|---------|-------------|
| `hooks` | List all git hooks in repository |
| Pre-commit hooks are automatically checked before commits |
| Option to skip hooks with confirmation |

### Repository State

| Command | Description |
|---------|-------------|
| `state` | Show current repository state (merge/rebase/cherry-pick) |
| Displays active operations and conflict status |
| Provides commands to continue or abort operations |

### Repository Management

| Command | Description |
|---------|-------------|
| `init` | Initialize a new repository |
| `uninit` | Remove git repository (clear history) |
| `clone` | Clone a repository with progress display |
| `remote` | Manage remote repositories |
| `fetch` | Fetch from remote with status updates |
| `tag` | Tag management (list, create, delete) |
| `config` | Git configuration management |

### History & Inspection

| Command | Description |
|---------|-------------|
| `show` | Show commit details with formatted output |
| `revert` | Revert commits with confirmation |
| `cherry-pick` | Apply commits from another branch |
| `blame` | Show who last modified each line |
| `grep` | Search in repository with formatted results |

## Configuration

Gittable uses configuration files to customize commit prompts and behavior. Create one of the following files in your project root:

- `.gittable.js`
- `.gittable.json`
- Or add config to `package.json` under `gittable` key

### Example Configuration (`.gittable.js`)

```javascript
module.exports = {
  types: [
    { value: 'feat', name: 'feat:     A new feature' },
    { value: 'fix', name: 'fix:      A bug fix' },
    { value: 'docs', name: 'docs:     Documentation only changes' },
    { value: 'style', name: 'style:    Code style changes (formatting, etc.)' },
    { value: 'refactor', name: 'refactor: Code refactoring' },
    { value: 'perf', name: 'perf:     Performance improvements' },
    { value: 'test', name: 'test:     Adding or updating tests' },
    { value: 'chore', name: 'chore:    Maintenance tasks' },
  ],
  scopes: [
    'components',
    'api',
    'auth',
    'db',
    'config',
    'utils',
  ],
  allowTicketNumber: true,
  ticketNumberPrefix: 'TICKET-',
  ticketNumberRegExp: '\\d{1,5}',
  subjectLimit: 100,
  allowBreakingChanges: ['feat', 'fix'],
  skipQuestions: [],
  usePreparedCommit: false,
};
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `types` | Array | Commit types with value and name |
| `scopes` | Array | Available scopes for commits |
| `allowTicketNumber` | Boolean | Enable ticket number input |
| `ticketNumberPrefix` | String | Prefix for ticket numbers |
| `ticketNumberRegExp` | String | Regex pattern for ticket validation |
| `subjectLimit` | Number | Maximum subject line length |
| `allowBreakingChanges` | Array | Types that allow breaking changes |
+ | `skipQuestions` | Array | Questions to skip (e.g., `['body', 'footer']`) |
| `usePreparedCommit` | Boolean | Use previous commit as default |

## Usage Examples

### Creating a Commit

```bash
gittable commit
```

This enhanced interactive command guides you through:

1. **Staging files** (if unstaged files exist):
   - Stage more files (interactive selection)
   - Stage all files
   - Proceed with only staged files
2. **Commit message creation**:
   - Selecting commit type (feat, fix, docs, etc.)
   - Choosing scope (optional)
   - Entering ticket number (if enabled)
   - Writing commit message
   - Adding extended description (optional)
   - Breaking changes (if applicable)
   - Issues closed (optional)
3. **Commit preview and editing**:
   - Review full commit message
   - Edit message if needed
   - Confirm and commit
4. **Post-commit actions** (optional):
   - Push to remote
   - Sync (fetch + rebase + push)
   - Skip

### Branch Management

```bash
# List all branches
gittable branch

# Create and checkout new branch
gittable branch create feature/new-feature

# Delete branch
gittable branch delete old-branch
```

### Status Check

```bash
gittable status
# or use short alias
gittable s
```

Shows a beautiful, color-coded status display with:

- Current branch information
- Last commit message and time
- Staged files
- Unstaged files
- Untracked files
- Ahead/behind information relative to remote
- Smart suggestions for next actions

### Enhanced Commit Workflow

The `commit` command now handles the complete workflow automatically:

```bash
gittable commit
```

This enhanced flow will:
1. **Check for unstaged files** and offer to:
   - Stage more files (interactive selection)
   - Stage all files
   - Proceed with only staged files
2. **Create commit** with conventional format (interactive prompts)
3. **Preview commit message** with option to:
   - Edit the message
   - View full message
   - Proceed with commit
4. **Post-commit options**:
   - Push to remote
   - Sync (fetch + rebase + push)
   - Skip

### Legacy Workflow Commands (Backward Compatibility)

The following commands still work but are now thin wrappers around the enhanced `commit` command:

```bash
# These all now use the enhanced commit flow internally
gittable commit-push     # Commit and push
gittable commit-sync     # Commit and sync
```

### Pull with Rebase

The `pull` command now supports rebase:

```bash
# Interactive: choose merge or rebase
gittable pull

# Direct rebase
gittable pull --rebase

# Legacy command (still works)
gittable pull-rebase
```

### Smart Suggestions

Gittable provides context-aware suggestions after each command:

- After `status`: suggests adding files if there are unstaged changes
- After `add`: suggests committing staged files
- After `commit`: integrated push/sync options (no separate suggestion needed)
- After `push`: suggests creating PR if on feature branch
- After failed `push`: suggests pulling or syncing if branch is behind

### Quick Info

Get a quick overview of your repository:

```bash
gittable info
```

Shows:
- Current branch
- Remote status (ahead/behind)
- File changes summary
- Last commit info
- Stash count

### Enhanced Stash Management

Stash commands now support index-based selection:

```bash
# List stashes with indices
gittable stash

# Apply stash by index
gittable stash apply 0

# Pop stash by index
gittable stash pop 1
```

### Branch Management

```bash
# Clean up merged branches
gittable branch-clean

# Rename branch
gittable branch-rename old-name new-name

# Compare branches
gittable branch-compare branch1 branch2
```

### Conflict Resolution

```bash
# List all conflicted files
gittable conflicts

# Resolve a specific file
gittable resolve file.js
```

### Pattern-Based File Staging

Stage files using patterns:

```bash
# Stage all JavaScript files
gittable add-pattern "*.js"

# Stage all test files
gittable add-pattern "**/*.test.js"

# Stage files in a specific directory
gittable add-pattern "src/**/*.ts"
```

### Diff Preview

Preview changes before committing:

```bash
# Preview staged changes
gittable diff-preview

# Preview unstaged changes
gittable diff-preview --unstaged

# Preview all changes
gittable diff-preview --all
```

### Context-Aware Commit Suggestions

Gittable automatically suggests commit types based on changed files:
- Test files → suggests `test` type
- Documentation files → suggests `docs` type
- Config files → suggests `chore` type
- And more...

### Getting Help

```bash
# Show help for a specific command
gittable help commit
gittable help commit-push

# Or use --help flag
gittable commit --help
gittable push --help

# View examples
gittable examples

# Interactive tutorial
gittable tutorial
```

### Safety Features

Gittable includes safety features to protect your work:

- **Branch Protection**: Warns when pushing to protected branches (main, master, etc.)
- **Backup Before Destructive Operations**: Offers to create backup branches before hard resets
- **Confirmation Prompts**: Always confirms destructive operations like force push, branch deletion
- **Enhanced Error Messages**: Provides actionable solutions when operations fail

### Enhanced File Selection

File selection now groups files by directory for easier navigation:

- Files are organized by directory with visual separators
- Modified and untracked files are clearly marked
- Easier to find files in large repositories
- Long lists are paginated automatically (use `--all` to show all)

### Recent Commit Messages

When committing, you can now:

- Select from recent commit messages
- Reuse similar commit messages
- Speed up repetitive commits

### Backup and Recovery

Gittable automatically offers to create backup branches before destructive operations:

- **Before rebase**: Automatically prompts to create backup branch
- **Before hard reset**: Option to create backup branch
- **Restore from backup**: `gittable restore-backup` command

```bash
# Restore from a backup branch
gittable restore-backup backup/feature-rebase-2024-01-15T10-30-00

# Or interactively select from available backups
gittable restore-backup
```

Backup branches are created with the pattern: `backup/<branch>-<operation>-<timestamp>`

### Post-Commit Hooks

Post-commit hooks can be configured to run automatically after commits:

- Run tests after commit (optional)
- Send notifications
- Update issue trackers
- Execute custom scripts

Configure via user preferences:
```bash
# Enable post-commit hooks
gittable config set postCommit.enabled true
gittable config set postCommit.runTests true
```

### Color Themes

Customize the color theme for better visibility:

```bash
# List available themes
gittable theme list

# Set theme
gittable theme set dark
gittable theme set light
gittable theme set highContrast

# Auto-detect theme based on terminal
gittable theme auto
```

Available themes:
- `default` - Standard color scheme
- `dark` - Bright colors for dark terminals
- `light` - Muted colors for light terminals
- `highContrast` - High contrast for accessibility

### Command Chaining

Chain multiple commands together:

```bash
# Execute commands sequentially (stops on error)
gittable add . && commit && push

# Execute commands sequentially (continues on error)
gittable add . | commit | push
```

### File Metadata

Show file sizes and modification dates when selecting files:

```bash
# Add files with metadata display
gittable add --metadata
```

### Preview Changes

Preview diffs before staging or committing:

```bash
# Preview staged changes
gittable preview-diff staged

# Preview unstaged changes
gittable preview-diff unstaged

# Preview all changes
gittable preview-diff all

# Preview specific file
gittable preview-diff <file>
```

### Sound Alerts

Enable sound alerts for operation completion:

```bash
# Enable sounds
gittable config set sound.enabled true
```

Sounds play automatically for:
- Successful commits
- Long operation completions
- Errors (optional)

### Issue Tracker Integration

Automatic issue linking and PR creation:

```bash
# Create PR after push (auto-suggested)
gittable push
# Then select "Create PR" when prompted

# Or create PR directly
gittable create-pr
gittable pr
```

Features:
- Auto-detect GitHub/GitLab from remote URL
- Generate PR/MR creation links
- Auto-suggest issue numbers from branch names
- Issue links in commit messages

### CI/CD Integration

View CI/CD status and links:

```bash
# Info command shows CI/CD links
gittable info
```

Automatically detects:
- GitHub Actions
- GitLab CI/CD
- Bitbucket Pipelines

### Parallel Operations

Fetch from multiple remotes in parallel:

```bash
# Fetch from all remotes (parallel)
gittable fetch --all
```

### Verbose Mode

Enable verbose mode for detailed execution information:

```bash
gittable --verbose commit
gittable --verbose push
```

Shows detailed command execution and options.

### Dry Run Mode

Test commands without executing them:

```bash
gittable --dry-run commit
gittable --dry-run push
```

Shows what would happen without actually executing the command.

### Issue Tracker Integration

Gittable automatically suggests issue numbers from branch names:

- Branch `feature/issue-123` → suggests `#123` in commit footer
- Branch `bugfix/456` → suggests `#456` in commit footer
- Supports GitHub (#123), JIRA (PROJ-123), and custom formats

### Enhanced Conflict Handling

When merge or rebase conflicts occur, Gittable offers helpful options:

- **Auto-recovery suggestions**: Choose to resolve, use mergetool, continue, or abort
- **Conflict detection**: Automatically detects conflicts and offers solutions
- **Continue/Abort helpers**: Easy commands to continue or abort operations
- **Smart workflow**: Guides you through conflict resolution step-by-step

### Repository State Detection

Status command and `state` command show:

- **Active merge state**: Warns when merge is in progress
- **Active rebase state**: Warns when rebase is in progress
- **Active cherry-pick state**: Warns when cherry-pick is in progress
- **Conflict detection**: Lists conflicted files automatically
- **Clean state**: Shows when repository is in normal state

Use `gittable state` for detailed state information and conflict status.

### Git Hooks Support

- **Pre-commit hooks**: Automatically run before commits (with option to skip)
- **Hook listing**: View all installed hooks with `gittable hooks`
- **Hook execution time**: Shows how long hooks take to run
- **Skip hooks**: Option to skip hooks with confirmation

## Dependencies

### Production Dependencies

- **[chalk](https://github.com/chalk/chalk)** (^4.1.2) - Terminal string styling
- **[cli-table3](https://github.com/cli-table/cli-table3)** (^0.6.5) - Beautiful tables for CLI output
- **[find-config](https://github.com/shannonmoeller/find-config)** (^1.0.0) - Find configuration files in directory tree
- **[prettycli](https://github.com/siddharthkp/prettycli)** (^1.1.0) - Enhanced CLI logging with better formatting
- **[sisteransi](https://github.com/lukeed/sisteransi)** (^1.0.5) - ANSI escape sequences for terminal control
- **[wcwidth](https://github.com/jquast/wcwidth)** (^1.0.1) - Determine the printable width of a string
- **[word-wrap](https://github.com/jonschlinkert/word-wrap)** (^1.2.5) - Word wrapping utility

**Note**: Gittable uses a native prompt system (`src/ui/prompts/`) with no external UI dependencies. All prompts are self-contained implementations using only Node.js built-ins and chalk.

### Development Dependencies

- **[@biomejs/biome](https://biomejs.dev/)** (^1.9.4) - Fast formatter and linter

## License

## Architecture

Gittable uses a modular, category-based architecture with a unified native UI framework for better maintainability and extensibility. The codebase has been refactored for improved organization, error handling, and maintainability.

### Key Architectural Features

- **Unified Native Prompts**: Self-contained prompt system with no external UI dependencies
- **UI Framework**: High-level framework for consistent theming, layouts, and components
- **Category-Based Commands**: Commands organized by domain (core, branching, remote, workflow, etc.)
- **Modular Core**: Git operations split by domain (status, branch, commit, remote, state)
- **Command Registry**: Auto-discovery system for easy command registration
- **Error Handling**: Centralized error system with custom error classes
- **Organized Utilities**: Utilities organized by concern (git, ui, commands, validation, cache)
- **Constants Management**: Centralized constants for better maintainability

### Project Structure

```
gittable/
├── src/
│   ├── cli/          # CLI layer (entry, parsing, routing, interactive menu)
│   ├── commands/     # Commands organized by category
│   │   ├── core/     # Core workflow (status, add, commit, etc.)
│   │   ├── branching/# Branch operations (branch, merge, rebase)
│   │   ├── remote/   # Remote operations (push, pull, fetch)
│   │   ├── workflow/ # Combined workflows (commit-push, commit-sync)
│   │   ├── history/  # History & inspection (log, show, blame)
│   │   ├── repository/# Repository management (init, clone)
│   │   └── utilities/# Utility commands (help, config, theme)
│   ├── core/         # Core business logic
│   │   ├── git/      # Git operations (executor, status, branch, commit, remote, state)
│   │   ├── commit/   # Commit flow (modular: flow, validation, execution, staging, preview, etc.)
│   │   ├── errors/   # Error handling system (custom error classes)
│   │   ├── constants.js # Application constants
│   │   └── config/   # Configuration (loader, setup, mode-filter, adapter-loader)
│   ├── ui/           # UI system
│   │   ├── framework/# High-level UI framework (theme, layout, messages, prompts, tables, results)
│   │   ├── prompts/  # Unified native prompt system (text, select, multiselect, confirm, etc.)
│   │   └── components/# Reusable components (banner, status, table)
│   └── utils/        # Shared utilities (organized by concern)
│       ├── git/      # Git-related utilities
│       ├── ui/        # UI-related utilities
│       ├── commands/  # Command helpers
│       ├── validation/# Validation utilities
│       └── cache/     # Caching system
├── test/             # Test suite (unit, integration, fixtures, helpers)
├── bin/              # Executable scripts (git-cz adapter)
└── scripts/          # Build and publish scripts
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for complete architecture documentation.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Gittable is built with the following excellent open-source projects:

- **[conventional-changelog](https://github.com/conventional-changelog)** - Conventional commits specification
- **[chalk](https://github.com/chalk/chalk)** by [@sindresorhus](https://github.com/sindresorhus) - Terminal string styling
- **[cli-table3](https://github.com/cli-table/cli-table3)** - Beautiful CLI tables
- **[Biome](https://biomejs.dev/)** - Fast formatter and linter

**Note**: Gittable features a native prompt system built from scratch, eliminating external UI dependencies while maintaining a beautiful, consistent user experience.

## Author

**GG-Santos** from Wab n' Wab Atelier

- Email: ggsantos_0415@proton.me
- GitHub: [@GG-Santos](https://github.com/GG-Santos)

---

<div align="center">

Made with dedication by the Gittable team

[Report Bug](https://github.com/GG-Santos/Gittable/issues) • [Request Feature](https://github.com/GG-Santos/Gittable/issues) • [View on GitHub](https://github.com/GG-Santos/Gittable)

</div>
