# Gittable

<div align="center">

**A modern, interactive Git CLI wrapper with conventional commits**

[![forthebadge](https://img.shields.io/badge/NPM-PUBLISHED-ff4d4d?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/gittable)
[![forthebadge](https://img.shields.io/badge/MADE%20WITH-JAVASCRIPT-ff4d4d?style=for-the-badge&logo=javascript&logoColor=white)](https://www.npmjs.com/package/gittable)
[![forthebadge](https://img.shields.io/badge/BUILT%20FOR-DEVELOPERS-ff4d4d?style=for-the-badge&logo=git&logoColor=white)](https://github.com/GG-Santos/Gittable)

[Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Architecture](./ARCHITECTURE.md)

</div>

---

Gittable is a modern, interactive Git CLI wrapper that enhances the standard Git experience with beautiful prompts, conventional commits enforcement, and intelligent workflow suggestions. It provides a user-friendly interface for common Git operations while maintaining full compatibility with standard Git commands.

## ✨ Features

- **🎨 Beautiful CLI Interface** - Native prompt system with colorful banners, tables, and status displays
- **📝 Conventional Commits** - Enforces conventional commit message format for better project history
- **⚡ Workflow Shortcuts** - Combined commands like `quick` (add+commit+push), `commit-push`, `add-commit`
- **🧠 Smart Suggestions** - Context-aware next-step prompts after each command
- **🛡️ Safety Features** - Branch protection warnings, backup before destructive operations
- **🔧 Fully Configurable** - Customize commit types, scopes, and command behavior
- **📚 Interactive Tutorial** - Learn Git workflows with guided tutorials
- **🚀 Fast & Lightweight** - Minimal dependencies, maximum performance

## 📦 Installation

### Global Installation (Recommended)

```bash
npm install -g gittable
```

### Local Installation

```bash
npm install --save-dev gittable
```

### Using npx

```bash
npx gittable <command>
```

For detailed installation instructions, see the [Installation](#installation) section below.

## 🚀 Quick Start

### Interactive Mode

Simply run `gittable` without any arguments to enter interactive mode:

```bash
gittable
```

This displays a beautiful category-based menu for easy command discovery.

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

# Quick workflow (add + commit + push)
gittable quick
gittable q
```

## 📖 Available Commands

### Core Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `status` | `st`, `s` | Show repository status with color-coded display |
| `info` | | Quick repository overview |
| `add` | | Stage files for commit with interactive selection |
| `commit` | `ci`, `save` | Create commits with conventional format |
| `diff` | | Show changes with formatted output |
| `log` | | View commit history with formatted output |

### Workflow Commands ⚡

| Command | Aliases | Description |
|---------|---------|-------------|
| `quick` | `q` | Full workflow: add + commit + push |
| `add-commit` | `ac` | Stage files and commit in one flow |
| `commit-push` | `cp` | Commit and push in one flow |
| `commit-sync` | `cs` | Commit and sync (fetch + rebase + push) |
| `sync` | | Synchronize (pull + rebase + push) |

### Branching Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `branch` | `br`, `co` | Branch management (list, create, checkout, delete) |
| `checkout` | `co` | Checkout files or branches |
| `merge` | | Merge branches with interactive prompts |
| `rebase` | | Rebase operations with safety checks |
| `branch-clean` | | Delete merged branches interactively |

### Remote Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `push` | `ps`, `up` | Push to remote repository |
| `pull` | `pl`, `down` | Fetch and merge from remote |
| `fetch` | | Fetch from remote with status updates |
| `create-pr` | `pr` | Create pull request after push |

See the [Available Commands](#-available-commands) section above for more commands.

## ⚙️ Configuration

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
  subjectLimit: 100,
  allowBreakingChanges: ['feat', 'fix'],
};
```

See the [Configuration](#️-configuration) section above for more details.

## 📚 Documentation

- **[Architecture](./ARCHITECTURE.md)** - System architecture and design
- **README** - This file contains installation, usage, and configuration guides

## 💡 Usage Examples

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

### Quick Workflow

```bash
gittable quick
# or
gittable q
```

This will:
1. Show changes
2. Stage files (with confirmation)
3. Create a commit (interactive)
4. Push to remote (with confirmation)

### Combined Commands

```bash
# Stage and commit in one flow
gittable add-commit
gittable ac

# Commit and push
gittable commit-push
gittable cp

# Commit and sync (fetch + rebase + push)
gittable commit-sync
gittable cs
```

### Branch Management

```bash
# List all branches
gittable branch

# Create and checkout new branch
gittable branch create feature/new-feature

# Clean up merged branches
gittable branch-clean
```

### Status Check

```bash
gittable status
# or use short alias
gittable st
```

Shows a beautiful, color-coded status display with:
- Current branch information
- Last commit message and time
- Staged files
- Unstaged files
- Untracked files
- Ahead/behind information relative to remote
- Smart suggestions for next actions

## 🛠️ Development

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Git

### Setup

```bash
# Clone repository
git clone https://github.com/GG-Santos/Gittable.git
cd Gittable

# Install dependencies
npm install

# Link for local development
npm link

# Run tests
npm test

# Lint code
npm run lint
```

For development setup, see the [Development](#️-development) section above.

## 🏗️ Architecture

Gittable uses a modular, category-based architecture for better maintainability and extensibility.

### Project Structure

```
gittable/
├── src/
│   ├── cli/          # CLI layer (entry, parsing, routing)
│   ├── commands/     # Commands organized by category
│   ├── core/         # Core business logic
│   ├── ui/           # UI components and framework
│   └── utils/        # Shared utilities
├── test/             # Test suite (unit, integration, fixtures)
├── scripts/          # Build and publish scripts
└── index.js          # Main entry point
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## 📦 Dependencies

### Production Dependencies

- **chalk** (^4.1.2) - Terminal string styling
- **cli-table3** (^0.6.5) - Beautiful tables for CLI output
- **find-config** (^1.0.0) - Configuration file discovery
- **prettycli** (^1.1.0) - Enhanced CLI logging
- **sisteransi** (^1.0.5) - ANSI escape sequences
- **wcwidth** (^1.0.1) - Character width calculation
- **word-wrap** (^1.2.5) - Text wrapping utility

### Development Dependencies

- **@biomejs/biome** (^1.9.4) - Fast formatter and linter

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit using conventional commits (`feat: add amazing feature`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

For more details, see the [Development](#️-development) section above.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Gittable is built with the following excellent open-source projects:

- **[@clack/prompts](https://github.com/natemoo-re/clack)** by [@natemoo-re](https://github.com/natemoo-re) - Beautiful CLI prompts library
- **[conventional-changelog](https://github.com/conventional-changelog)** - Conventional commits specification
- **[chalk](https://github.com/chalk/chalk)** by [@sindresorhus](https://github.com/sindresorhus) - Terminal string styling
- **[cli-table3](https://github.com/cli-table/cli-table3)** - Beautiful CLI tables
- **[Biome](https://biomejs.dev/)** - Fast formatter and linter

## 👤 Author

**GG-Santos** from Wab n' Wab Atelier

- Email: ggsantos_0415@proton.me
- GitHub: [@GG-Santos](https://github.com/GG-Santos)

---

<div align="center">

Made with dedication by the Wab n' Wab Atelier

[Report Bug](https://github.com/GG-Santos/Gittable/issues) • [Request Feature](https://github.com/GG-Santos/Gittable/issues) • [View on GitHub](https://github.com/GG-Santos/Gittable)

</div>
