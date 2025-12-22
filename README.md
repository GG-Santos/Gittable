# Gittable

> Modern Git CLI with Conventional Commits

[![npm version](https://img.shields.io/npm/v/@gg-santos/gittable.svg)](https://www.npmjs.com/package/@gg-santos/gittable)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

## Introduction

**Gittable** is a powerful, workflow-oriented Git CLI tool that transforms your Git experience with an intuitive interface and intelligent commit workflow. Unlike traditional Git wrappers, Gittable organizes commands by development workflows, making it easier to find and execute the right command at the right time.

### Key Highlights

- **Workflow-Oriented Design**: Interactive menu system organized by development workflows (Starting a Project, Daily Development, Collaboration, History & Inspection, Advanced Operations, Maintenance & Utilities)
- **50+ Git Commands**: Complete coverage of Git operations including core commands, branching, remote operations, history inspection, and utilities
- **Intelligent Commit Workflow**: Interactive file staging with pattern matching, conventional commits with configurable types and scopes, commit preview and review before execution, and automatic staging area validation
- **Combined Workflow Commands**: Use `pull --rebase` for rebasing workflows (commit includes push/sync options automatically)
- **Rich Terminal UI**: Color-coded output with theme customization, interactive prompts and tables, progress indicators and spinners, and clear error messages with suggestions
- **Auto-Discovery System**: Commands automatically discovered and registered from category directories
- **Configurable**: Customize commit types, scopes, ticket numbers, and more via `.gittable.js` or `.gittable.json`
- **Advanced Features**: Branch management, stash operations, undo/recovery tools, repository inspection, command history tracking, and help system
- **Standalone Tool**: No external dependencies on Commitizen or other commit message tools

## Features

### Workflow-Oriented Interface

Gittable organizes commands into intuitive workflow categories:

- **Starting a Project**: Initialize repositories and configure Git
- **Daily Development**: Check status, stage files, and create commits
- **Collaboration**: Push, pull, sync, and manage branches
- **History & Inspection**: View history, search, and inspect repository
- **Advanced Operations**: Undo, stash, merge conflicts, and debugging
- **Maintenance & Utilities**: File operations, repository management, and utilities

### 50+ Git Commands

Complete coverage of Git operations:

- **Core Commands**: `status`, `add`, `commit`, `diff`, `log`, `show`, `info`
- **Branching**: `branch`, `checkout`, `switch`, `merge`, `rebase`, `cherry-pick`, `branch-clean`, `branch-rename`, `branch-compare`
- **Remote Operations**: `push`, `pull`, `fetch`, `sync`, `remote`, `create-pr`
- **History & Inspection**: `blame`, `grep`, `shortlog`, `describe`, `diff` (includes range-diff)
- **File Operations**: `remove` / `rm`, `move` / `mv`, `restore`, `clean`, `diff-preview`
- **Repository Management**: `init`, `clone`, `archive`, `worktree`, `submodule`, `tag`
- **Utilities**: `stash`, `undo`, `revert`, `bisect`, `config`, `theme`, `help`, `tutorial`

### Intelligent Commit Workflow

Gittable's commit workflow guides you through creating perfect conventional commits:

1. **Interactive File Staging**: Select files with pattern matching support
2. **Conventional Commits**: Choose from configurable commit types (feat, fix, docs, etc.) and scopes
3. **Commit Preview**: Review your commit message and staged files before execution
4. **Automatic Validation**: Ensures you have staged files and validates commit message format

### Combined Workflow Commands

Streamline common workflows with combined commands:

**Note**: The `commit` command already includes push/sync options. After creating a commit, you'll be prompted to push, sync, or skip - no separate commands needed! Use `pull --rebase` for rebasing workflows.

### Rich Terminal UI

- Color-coded output with customizable themes
- Interactive prompts with keyboard navigation
- Formatted tables for status and branch listings
- Progress indicators and spinners for long-running operations
- Clear error messages with helpful suggestions

### Auto-Discovery System

Commands are automatically discovered and registered from category directories, making it easy to extend Gittable with custom commands.

### Configuration System

Customize Gittable to match your workflow via `.gittable.js` or `.gittable.json`:

- Commit types and scopes
- Ticket number support
- Subject limits and separators
- Breaking changes configuration
- And much more

### Advanced Features

- **Branch Management**: Create, delete, rename, compare, and clean branches
- **Stash Operations**: Full stash management with message support
- **Undo/Recovery**: Safely undo commits and recover lost work
- **Repository Inspection**: View repository state, hooks, and conflicts
- **Command History**: Track and replay frequently used commands
- **Help System**: Built-in help and tutorial system

## Installation

### Global Installation

```bash
npm install -g @gg-santos/gittable
```

### Local Installation

```bash
npm install --save-dev @gg-santos/gittable
```

### Verify Installation

```bash
gittable --version
```

## Quick Start

### Interactive Mode

Simply run `gittable` without any arguments to launch the interactive menu:

```bash
gittable
```

Navigate through workflow categories to find and execute commands.

### Command-Line Mode

Use Gittable like any Git command:

```bash
# Check repository status
gittable status

# Stage files interactively
gittable add

# Create a commit with conventional format
gittable commit

# Push to remote
gittable push

# View commit history
gittable log
```

### Command Aliases

Gittable provides two command aliases for quick access:

- `gittable` - Main command
- `gg-gitz` - Short alias

## Usage

### Interactive Mode

When you run `gittable` without arguments, you'll see an interactive menu organized by workflows:

```
GITTABLE v1.0.7

  Starting a Project:
    • Initialize Repository
    • Configuration

  Daily Development:
    • Check Status
    • Stage Files
    • Create Commits
    • Preview Changes

  Collaboration:
    • Remote Operations
    • Branch Management
    • Advanced Branching

  ...
```

Navigate using arrow keys and select commands to execute.

### Command-Line Mode

Gittable supports all standard Git commands with enhanced functionality:

```bash
# Status with enhanced formatting
gittable status
gittable s          # Short status

# Interactive file staging
gittable add
gittable add --all  # Stage all changes

# Commit with conventional format (includes push/sync options)
gittable commit
gittable commit -a  # Stage all and commit

# Combined workflows
gittable pull --rebase  # Pull with rebase

# Branch management
gittable branch
gittable branch create feature/new
gittable branch-clean  # Delete merged branches

# Stash operations
gittable stash
gittable stash create "WIP: feature"
gittable stash pop

# View history
gittable log
gittable show
```

### Getting Help

```bash
# Show help menu
gittable help

# Show help for specific command
gittable help commit

# Show usage examples
gittable examples

# Interactive tutorial
gittable tutorial
```

## Configuration

Gittable can be configured via `.gittable.js` or `.gittable.json` in your project root or home directory.

### Creating a Configuration File

Copy the example configuration:

```bash
cp .gittable.example.js .gittable.js
```

Or create your own `.gittable.js`:

```javascript
module.exports = {
  // Commit types
  types: [
    { value: 'feat', name: 'New Feature' },
    { value: 'fix', name: 'Bug Fix' },
    { value: 'docs', name: 'Documentation' },
    // ... more types
  ],

  // Scopes
  scopes: [
    { name: 'components' },
    { name: 'api' },
    { name: 'utils' },
    // ... more scopes
  ],

  // Ticket number support
  allowTicketNumber: false,
  isTicketNumberRequired: false,
  ticketNumberPrefix: 'TICKET-',
  ticketNumberRegExp: '\\d{1,5}',

  // Other options
  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
  skipQuestions: ['body'],
  subjectLimit: 100,
  subjectSeparator: ': ',
};
```

### Configuration Options

- **types**: Array of commit types with value and display name
- **scopes**: Array of scope objects (automatically categorized)
- **allowTicketNumber**: Enable ticket number in commit footer
- **isTicketNumberRequired**: Make ticket number mandatory
- **ticketNumberPrefix**: Prefix for ticket numbers (e.g., "TICKET-")
- **ticketNumberRegExp**: Regex pattern for ticket number validation
- **allowCustomScopes**: Allow typing custom scopes
- **allowBreakingChanges**: Array of types that can have breaking changes
- **skipQuestions**: Array of questions to skip (e.g., ['body', 'footer'])
- **subjectLimit**: Maximum length for commit subject (default: 100)
- **subjectSeparator**: Separator between type and subject (default: ': ')
- **breaklineChar**: Character to use for line breaks in body/footer (default: '|')
- **upperCaseSubject**: Capitalize first letter of subject
- **usePreparedCommit**: Reuse commit from .git/COMMIT_EDITMSG
- **askForBreakingChangeFirst**: Ask for breaking change as first question

See `.gittable.example.js` for a complete example configuration.

## Commands

Gittable organizes commands into workflow-based categories:

### Starting a Project
- `init` - Initialize a new Git repository
- `clone` - Clone a repository
- `config` - Configure Git settings

### Daily Development
- `status` / `s` - Show repository status
- `add` - Stage files interactively
- `commit` / `ci` - Create commits with conventional format
- `diff` - Show changes
- `diff-preview` - Preview changes before committing
- `info` - Quick repository overview

### Collaboration
- `push` - Push to remote
- `pull` - Pull from remote
- `fetch` - Fetch from remote
- `sync` - Sync with remote (fetch + rebase + push)
- `branch` - Branch management
- `merge` - Merge branches
- `rebase` - Rebase current branch
- `create-pr` - Create pull request

### History & Inspection
- `log` - View commit history
- `show` - Show commit details
- `blame` - Show file blame
- `grep` - Search commit messages
- `shortlog` - Summarized commit log
- `describe` - Describe commit
- `diff` / `range-diff` - Show changes or compare commit ranges (use `diff --range-diff` or `range-diff`)

### Advanced Operations
- `stash` - Stash management
- `undo` - Undo last commit
- `revert` - Revert a commit
- `bisect` - Binary search for bugs
- `conflicts` - View merge conflicts
- `resolve` - Resolve conflicts

### Maintenance & Utilities
- `remove` / `rm` - Remove files
- `move` / `mv` - Move/rename files
- `restore` - Restore files
- `clean` - Clean untracked files
- `tag` - Tag management
- `archive` - Create archive
- `worktree` - Manage worktrees
- `submodule` - Manage submodules
- `theme` - Customize appearance
- `help` - Show help
- `examples` - Show usage examples
- `tutorial` - Interactive tutorial

### Combined Workflows
- `pull --rebase` - Pull with rebase

**Note**: The `commit` command includes push/sync options automatically. After committing, you'll be prompted to push, sync, or skip.

For detailed help on any command, use `gittable help <command>`.

## Acknowledgments

This project was inspired and jumpstarted by:

- **[cz-customizable](https://github.com/leoforfree/cz-customizable)** - For commit message formatting and conventional commits inspiration
- **[bombshell-dev](https://github.com/bombshell-dev/)** - For CLI framework inspiration
- **[chalk](https://github.com/chalk/chalk)** - For terminal colors

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`gittable commit`)
4. Push to the branch (`gittable push origin feature/amazing-feature`)
5. Open a Pull Request

### Development

```bash
# Clone the repository
git clone https://github.com/GG-Santos/Gittable.git
cd Gittable

# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- **Repository**: [https://github.com/GG-Santos/Gittable](https://github.com/GG-Santos/Gittable)
- **Issues**: [https://github.com/GG-Santos/Gittable/issues](https://github.com/GG-Santos/Gittable/issues)
- **Homepage**: [https://github.com/GG-Santos/Gittable#readme](https://github.com/GG-Santos/Gittable#readme)

