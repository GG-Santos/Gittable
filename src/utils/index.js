/**
 * Utils Index - Re-exports commonly used utilities for convenience
 *
 * Usage:
 *   const { showCommandHeader, promptConfirm } = require('../../utils');
 *   const { Cache, getCache } = require('../../utils');
 */

// Command helpers - most commonly used
const {
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
  handleCancel,
  showSmartSuggestion,
} = require('./command-helpers');

// Cache utilities
const { Cache, getCache, clearAllCaches } = require('./cache');

// Error helpers
const { parseGitError, displayEnhancedError } = require('./error-helpers');

// Branch utilities
const { checkBranchProtection } = require('./branch-protection');
const { validateBranch, getValidBranch } = require('./branch-helpers');

// File utilities
const { groupFilesByDirectory, createFileOptions, filterFileOptions } = require('./file-selection');
const {
  getFileMetadata,
  getFilesMetadata,
  formatFileSize,
  formatDate,
} = require('./file-metadata');

// User preferences
const { getPreference, setPreference, loadPreferences } = require('./user-preferences');

// Theme
const {
  THEMES,
  getTheme,
  detectTerminalCapabilities,
  autoSelectTheme,
  applyTheme,
  getPrimaryColor,
} = require('./color-theme');

// Logger
const logger = require('./logger');

module.exports = {
  // Command helpers
  showCommandHeader,
  requireTTY,
  execGitWithSpinner,
  promptConfirm,
  handleCancel,
  showSmartSuggestion,
  // Cache
  Cache,
  getCache,
  clearAllCaches,
  // Error helpers
  parseGitError,
  displayEnhancedError,
  // Branch utilities
  checkBranchProtection,
  validateBranch,
  getValidBranch,
  // File utilities
  groupFilesByDirectory,
  createFileOptions,
  filterFileOptions,
  getFileMetadata,
  getFilesMetadata,
  formatFileSize,
  formatDate,
  // User preferences
  getPreference,
  setPreference,
  loadPreferences,
  // Theme
  THEMES,
  getTheme,
  detectTerminalCapabilities,
  autoSelectTheme,
  applyTheme,
  getPrimaryColor,
  // Logger
  logger,
};
