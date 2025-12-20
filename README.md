# Gittable

<div align="center">

**A modern, interactive Git CLI wrapper with conventional commits**

[![forthebadge](https://img.shields.io/badge/NPM-PUBLISHED-ff4d4d?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/gittable)
[![forthebadge](https://img.shields.io/badge/MADE%20WITH-JAVASCRIPT-ff4d4d?style=for-the-badge&logo=javascript&logoColor=white)](https://www.npmjs.com/package/gittable)
[![forthebadge](https://img.shields.io/badge/BUILT%20FOR-DEVELOPERS-ff4d4d?style=for-the-badge&logo=git&logoColor=white)](https://github.com/GG-Santos/Gittable)

[Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation)

</div>

---

Gittable provides a beautiful, user-friendly interface for common Git operations while maintaining full compatibility with standard Git commands. Built with [@clack/prompts](https://github.com/natemoo-re/clack) for an exceptional command-line experience, Gittable enforces conventional commit message formats and offers intelligent, context-aware suggestions.

## Features

- **Interactive Prompts** - Beautiful, intuitive command-line interface powered by @clack/prompts
- **Conventional Commits** - Enforces conventional commit message format for better project history
- **Full Git Coverage** - Wraps all major Git commands with enhanced user experience
- **Smart Defaults** - Context-aware suggestions and shortcuts for common workflows
- **Beautiful UI** - Colorful banners, tables, and status displays for better readability
- **Fast & Lightweight** - Minimal dependencies, maximum performance
- **Commitizen Adapter** - Works seamlessly with Commitizen for standardized commits

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
| `status` | `st` | Show repository status with color-coded display |
| `branch` | `br`, `co` | Branch management (list, create, checkout, delete) |
| `commit` | `ci` | Create commits with conventional format |
| `pull` | `pl` | Fetch and merge from remote |
| `push` | `ps` | Push to remote repository |
| `sync` | | Synchronize (pull + rebase + push) |
| `merge` | | Merge branches with interactive prompts |
| `rebase` | | Rebase operations with safety checks |
| `stash` | | Stash management (list, apply, drop) |
| `log` | | View commit history with formatted output |
| `undo` | `reset` | Undo operations and reflog browser |

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
| `skipQuestions` | Array | Questions to skip (e.g., `['body', 'footer']`) |
| `usePreparedCommit` | Boolean | Use previous commit as default |

## Usage Examples

### Creating a Commit

```bash
gittable commit
```

This interactive command guides you through:

1. Selecting commit type (feat, fix, docs, etc.)
2. Choosing scope (optional)
3. Entering ticket number (if enabled)
4. Writing commit message
5. Adding extended description (optional)
6. Breaking changes (if applicable)
7. Issues closed (optional)

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
```

Shows a beautiful, color-coded status display with:

- Current branch information
- Staged files
- Unstaged files
- Untracked files
- Ahead/behind information relative to remote

## Dependencies

### Production Dependencies

- **[@clack/prompts](https://github.com/natemoo-re/clack)** (^0.7.0) - Beautiful CLI prompts and interactive components
- **[chalk](https://github.com/chalk/chalk)** (^4.1.2) - Terminal string styling
- **[cli-table3](https://github.com/cli-table/cli-table3)** - Beautiful tables for CLI output
- **[email-prompt](https://github.com/team-767/email-prompt)** - Email input with autocompletion
- **[find-config](https://github.com/shannonmoeller/find-config)** (^1.0.0) - Find configuration files in directory tree
- **[prettycli](https://github.com/siddharthkp/prettycli)** - Enhanced CLI logging with better formatting
- **[word-wrap](https://github.com/jonschlinkert/word-wrap)** (^1.2.5) - Word wrapping utility

### Development Dependencies

- **[@biomejs/biome](https://biomejs.dev/)** (^1.9.4) - Fast formatter and linter
- **[commitizen](https://github.com/commitizen/cz-cli)** (^4.3.0) - Commit message standardization

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Gittable is built with the following excellent open-source projects:

- **[@clack/prompts](https://github.com/natemoo-re/clack)** by [@natemoo-re](https://github.com/natemoo-re) - Beautiful CLI prompts library
- **[conventional-changelog](https://github.com/conventional-changelog)** - Conventional commits specification
- **[chalk](https://github.com/chalk/chalk)** by [@sindresorhus](https://github.com/sindresorhus) - Terminal string styling
- **[cli-table3](https://github.com/cli-table/cli-table3)** - Beautiful CLI tables
- **[Biome](https://biomejs.dev/)** - Fast formatter and linter
- **[cz-customizable](https://github.com/leoforfree/cz-customizable)** - Customizable commitizen adapter for commit message prompts

## Author

**GG-Santos** from Wab n' Wab Atelier

- Email: ggsantos_0415@proton.me
- GitHub: [@GG-Santos](https://github.com/GG-Santos)

---

<div align="center">

Made with dedication by the Gittable team

[Report Bug](https://github.com/GG-Santos/Gittable/issues) • [Request Feature](https://github.com/GG-Santos/Gittable/issues) • [View on GitHub](https://github.com/GG-Santos/Gittable)

</div>
