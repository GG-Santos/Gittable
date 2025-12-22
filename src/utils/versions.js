/**
 * Command versions
 * Each command has its own version for independent versioning
 */
module.exports = {
  // Core commit workflow
  commit: '3.4.2',
  status: '1.1.0',
  'status-short': '1.0.0',
  add: '2.0.7',
  diff: '1.1.0',
  info: '1.0.0',

  // Branching & merging
  branch: '1.2.0',
  checkout: '1.1.0',
  switch: '1.0.0',
  merge: '1.1.0',
  'merge-continue': '1.0.0',
  'merge-abort': '1.0.0',
  mergetool: '1.0.0',
  rebase: '1.1.0',
  'cherry-pick': '1.0.0',
  'branch-clean': '1.0.0',
  'branch-rename': '1.0.0',
  'branch-compare': '1.0.0',

  // Remote operations
  pull: '1.1.0',
  push: '1.1.0',
  sync: '1.1.0',
  fetch: '1.0.0',
  remote: '1.1.0',
  'remote-set-url': '1.0.0',
  'create-pr': '1.0.0',
  'clear-cache': '1.0.0',
  clone: '1.0.0',

  // Combined workflows (removed - use pull --rebase instead)

  // History & inspection
  log: '1.1.0',
  show: '1.1.0',
  blame: '1.0.0',
  grep: '1.0.0',
  shortlog: '1.0.0',
  describe: '1.0.0',
  'range-diff': '1.0.0',

  // File operations
  remove: '1.0.0',
  move: '1.0.0',
  restore: '1.0.0',
  'restore-backup': '1.0.0',
  clean: '1.0.0',
  'diff-preview': '1.0.0',
  'preview-diff': '1.0.0',

  // Repository management
  init: '1.0.0',
  uninit: '1.0.0',
  archive: '1.0.0',
  worktree: '1.0.0',
  submodule: '1.0.0',
  config: '1.1.2',
  tag: '1.1.0',
  'tag-push': '1.0.0',
  'tag-delete': '1.0.0',

  // Utilities - Help & Documentation
  help: '1.0.0',
  examples: '1.0.0',
  tutorial: '1.0.0',

  // Utilities - Customization
  theme: '2.0.1',

  // Utilities - Repository Inspection
  state: '1.0.0',
  hooks: '1.0.0',
  conflicts: '1.0.0',
  resolve: '1.0.0',

  // Utilities - Command History
  history: '1.0.0',

  // Utilities - Undo & Recovery
  stash: '1.1.0',
  'stash-all': '1.0.0',
  undo: '1.1.0',
  revert: '1.0.0',
  bisect: '1.0.0',
};
