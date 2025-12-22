/**
 * Application constants
 * Centralized location for magic strings and configuration values
 */

/**
 * Commands that don't require a git repository
 */
const NO_REPO_COMMANDS = ['init', 'uninit', 'clone', 'help'];

/**
 * Commands that should not be saved to history
 */
const NO_HISTORY_COMMANDS = ['help', 'history'];

/**
 * Command category directories for auto-discovery
 */
const COMMAND_CATEGORIES = [
  'core',
  'branching',
  'remote',
  'workflow',
  'history',
  'repository',
  'utilities',
];

/**
 * Default remote name
 */
const DEFAULT_REMOTE = 'origin';

/**
 * Default subject limit for commit messages
 */
const DEFAULT_SUBJECT_LIMIT = 100;

/**
 * Cache TTL for status (in milliseconds)
 */
const STATUS_CACHE_TTL = 5000;

/**
 * Number of recent commit messages to show
 */
const RECENT_MESSAGES_LIMIT = 5;

/**
 * Number of staged files to show in preview
 */
const STAGED_FILES_PREVIEW_LIMIT = 10;

/**
 * Number of command suggestions to show
 */
const COMMAND_SUGGESTIONS_LIMIT = 10;

/**
 * Special marker values for interactive menus and prompts
 * These are internal implementation markers used for navigation and special options
 */
const INTERACTIVE_MARKERS = {
  BACK: '__back__', // Go back to previous menu/question
  DIRECT: '__direct__', // Direct command execution marker
  CUSTOM: '__custom__', // Custom option marker
  EMPTY: '__empty__', // Empty/no selection marker
};

module.exports = {
  NO_REPO_COMMANDS,
  NO_HISTORY_COMMANDS,
  COMMAND_CATEGORIES,
  DEFAULT_REMOTE,
  DEFAULT_SUBJECT_LIMIT,
  STATUS_CACHE_TTL,
  RECENT_MESSAGES_LIMIT,
  STAGED_FILES_PREVIEW_LIMIT,
  COMMAND_SUGGESTIONS_LIMIT,
  INTERACTIVE_MARKERS,
};

