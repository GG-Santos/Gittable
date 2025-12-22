/**
 * Centralized error handling system
 * Provides custom error classes and error handling utilities
 */

const chalk = require('chalk');
const prompts = require('../../ui/prompts');

/**
 * Base error class for all application errors
 */
class GittableError extends Error {
  constructor(message, code = 'GITTABLE_ERROR', options = {}) {
    super(message);
    this.name = 'GittableError';
    this.code = code;
    this.suggestion = options.suggestion || null;
    this.solution = options.solution || null;
    this.exitCode = options.exitCode || 1;
    this.isGittableError = true;
  }
}

/**
 * Error for cancelled operations
 */
class CancelledError extends GittableError {
  constructor(message = 'Operation cancelled', options = {}) {
    super(message, 'CANCELLED', { ...options, exitCode: 0 });
    this.name = 'CancelledError';
    this.isCancel = true;
  }
}

/**
 * Error for validation failures
 */
class ValidationError extends GittableError {
  constructor(message, field = null, options = {}) {
    super(message, 'VALIDATION_ERROR', options);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Error for git operation failures
 */
class GitError extends GittableError {
  constructor(message, command = null, options = {}) {
    super(message, 'GIT_ERROR', options);
    this.name = 'GitError';
    this.command = command;
  }
}

/**
 * Error for configuration issues
 */
class ConfigError extends GittableError {
  constructor(message, options = {}) {
    super(message, 'CONFIG_ERROR', options);
    this.name = 'ConfigError';
  }
}

/**
 * Error for command execution failures
 */
class CommandError extends GittableError {
  constructor(message, commandName = null, options = {}) {
    super(message, 'COMMAND_ERROR', options);
    this.name = 'CommandError';
    this.commandName = commandName;
  }
}

/**
 * Centralized error handler
 * Handles errors consistently across the application
 */
function handleError(error, context = {}) {
  // If it's already a GittableError, use it directly
  if (error.isGittableError) {
    displayError(error);
    return error.exitCode;
  }

  // Handle cancellation
  if (error.isCancel || error instanceof CancelledError) {
    prompts.cancel(chalk.yellow('Operation cancelled'));
    return 0;
  }

  // Convert common errors to GittableError
  if (error.message) {
    const gittableError = new GittableError(
      error.message,
      'UNKNOWN_ERROR',
      {
        suggestion: context.suggestion,
        solution: context.solution,
        exitCode: context.exitCode || 1,
      }
    );
    displayError(gittableError);
    return gittableError.exitCode;
  }

  // Fallback for unknown errors
  prompts.cancel(chalk.red('Fatal error'));
  console.error(error);
  return 1;
}

/**
 * Display error using UI framework
 */
function displayError(error) {
  const ui = require('../../ui/framework');
  
  ui.error(error.message, {
    suggestion: error.suggestion,
    solution: error.solution,
    exit: false, // Don't exit here, let caller handle it
  });
}

/**
 * Create error from git command result
 */
function createGitError(result, command = null) {
  const { parseGitError } = require('../../utils/validation');
  const parsed = parseGitError(result.error || result.stderr || 'Unknown git error', command);
  
  return new GitError(parsed.message, command, {
    suggestion: parsed.suggestion,
    solution: parsed.solution,
  });
}

module.exports = {
  GittableError,
  CancelledError,
  ValidationError,
  GitError,
  ConfigError,
  CommandError,
  handleError,
  displayError,
  createGitError,
};

