# Command Migration Status

This document tracks the migration of commands to use the new UI/UX framework.

## Migration Pattern

Commands are migrated from direct `@clack/prompts` usage to the framework:
- Replace `const clack = require('@clack/prompts')` with `const ui = require('../../ui/framework')`
- Replace `clack.cancel()` with `ui.error()` or `ui.warn()`
- Replace `clack.outro()` with `ui.success()`
- Replace `clack.text/select/confirm/multiselect()` with `ui.prompt.*()`
- Replace `clack.spinner()` with `ui.prompt.spinner()`

## Migrated Commands ✅

### Core Commands
- ✅ `src/commands/core/status.js` - Repository status display
- ✅ `src/commands/core/add.js` - File staging
- ✅ `src/commands/core/info.js` - Repository information
- ✅ `src/commands/core/log.js` - Commit history
- ✅ `src/commands/core/diff.js` - Show changes
- ✅ `src/commands/core/show.js` - Show commit
- ✅ `src/commands/core/status-short.js` - Short status display

### Workflow Commands
- ✅ `src/commands/workflow/add-commit.js` - Add and commit workflow
- ✅ `src/commands/workflow/quick.js` - Quick workflow (add + commit + push)
- ✅ `src/commands/workflow/commit-push.js` - Commit and push
- ✅ `src/commands/workflow/commit-sync.js` - Commit and sync
- ✅ `src/commands/workflow/commit-all.js` - Stage all and commit

### Branching Commands
- ✅ `src/commands/branching/branch.js` - Branch management
- ✅ `src/commands/branching/checkout.js` - Checkout files
- ✅ `src/commands/branching/merge.js` - Merge branches
- ✅ `src/commands/branching/rebase.js` - Rebase operations
- ✅ `src/commands/branching/switch.js` - Switch branches
- ✅ `src/commands/branching/merge-continue.js` - Continue merge
- ✅ `src/commands/branching/merge-abort.js` - Abort merge
- ✅ `src/commands/branching/cherry-pick.js` - Cherry-pick commits
- ✅ `src/commands/branching/mergetool.js` - Launch merge tool
- ✅ `src/commands/branching/branch-clean.js` - Clean merged branches
- ✅ `src/commands/branching/branch-rename.js` - Rename branches
- ✅ `src/commands/branching/branch-compare.js` - Compare branches

### Remote Commands
- ✅ `src/commands/remote/push.js` - Push to remote
- ✅ `src/commands/remote/remote.js` - Remote management
- ✅ `src/commands/remote/remote-set-url.js` - Update remote URL
- ✅ `src/commands/remote/fetch.js` - Fetch from remote
- ✅ `src/commands/remote/create-pr.js` - Create pull request
- ✅ `src/commands/remote/clear-cache.js` - Clear cache

### Repository Commands
- ✅ `src/commands/repository/init.js` - Initialize repository
- ✅ `src/commands/repository/clone.js` - Clone repository
- ✅ `src/commands/repository/uninit.js` - Remove git repository
- ✅ `src/commands/repository/archive.js` - Create archive
- ✅ `src/commands/repository/worktree.js` - Worktree management
- ✅ `src/commands/repository/submodule.js` - Submodule management

### Utilities
- ✅ `src/commands/utilities/stash.js` - Stash management
- ✅ `src/commands/utilities/tag.js` - Tag management
- ✅ `src/commands/utilities/conflicts.js` - List conflicts
- ✅ `src/commands/utilities/resolve.js` - Resolve conflicts
- ✅ `src/commands/utilities/state.js` - Repository state
- ✅ `src/commands/utilities/help.js` - Command help
- ✅ `src/commands/utilities/examples.js` - Usage examples
- ✅ `src/commands/utilities/clean.js` - Clean untracked files
- ✅ `src/commands/utilities/rm.js` - Remove files
- ✅ `src/commands/utilities/mv.js` - Move/rename files
- ✅ `src/commands/utilities/restore.js` - Restore files
- ✅ `src/commands/utilities/undo.js` - Undo operations
- ✅ `src/commands/utilities/revert.js` - Revert commits
- ✅ `src/commands/utilities/config.js` - Git configuration
- ✅ `src/commands/utilities/tag-push.js` - Create and push tags
- ✅ `src/commands/utilities/tag-delete.js` - Delete tags
- ✅ `src/commands/utilities/theme.js` - Theme management
- ✅ `src/commands/utilities/add-pattern.js` - Stage files by pattern
- ✅ `src/commands/utilities/diff-preview.js` - Preview diff summary
- ✅ `src/commands/utilities/preview-diff.js` - Preview changes
- ✅ `src/commands/utilities/stash-all.js` - Stash all changes
- ✅ `src/commands/utilities/restore-backup.js` - Restore from backup
- ✅ `src/commands/utilities/history.js` - Command history
- ✅ `src/commands/utilities/notify.js` - Notification management
- ✅ `src/commands/utilities/hooks.js` - Git hooks listing

### History Commands
- ✅ `src/commands/history/blame.js` - Blame file
- ✅ `src/commands/history/grep.js` - Search in repository
- ✅ `src/commands/history/shortlog.js` - Summarize commit log
- ✅ `src/commands/history/describe.js` - Describe commit
- ✅ `src/commands/history/range-diff.js` - Compare commit ranges

### Utility Commands (Final)
- ✅ `src/commands/utilities/bisect.js` - Binary search for bugs
- ✅ `src/commands/utilities/preset.js` - Workflow preset management
- ✅ `src/commands/utilities/template.js` - Commit template management
- ✅ `src/commands/utilities/tutorial.js` - Interactive tutorial
- ✅ `src/commands/base.js` - Base command helper

## Commands Using Helpers (Auto-Migrated) ✅

These commands use `command-helpers.js` which has been migrated to use the framework:
- ✅ `src/commands/core/commit.js` - Uses commitFlow (internal)
- ✅ `src/commands/remote/pull.js` - Uses execGitWithSpinner
- ✅ All commands using `showCommandHeader()`, `execGitWithSpinner()`, `promptConfirm()`, `showSmartSuggestion()`

## Remaining Commands

**All commands have been successfully migrated!** ✅

The list below was the original list of commands that needed migration, but they have all been completed.

## Migration Progress

- **Migrated**: 77 commands (ALL commands migrated!)
- **Auto-migrated via helpers**: ~20+ commands
- **Remaining**: 0 commands
- **Total**: ~96 commands

## Migration Complete! ✅

All commands have been successfully migrated to use the new UI framework. The framework provides:
- Consistent UI/UX across all commands
- Standardized message system (error, warn, info, note, success)
- Themed prompts and components
- Unified table system
- Standardized layout and banner system

## Next Steps

1. ✅ **All commands migrated** - Complete!
2. Test framework with different themes
3. Gather user feedback on UI/UX consistency
4. Add framework unit tests
5. Update command examples in documentation

## Notes

- Commands using `command-helpers.js` automatically benefit from framework migration
- The framework maintains backward compatibility
- Migration can be done incrementally without breaking existing functionality

