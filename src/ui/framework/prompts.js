/**
 * Prompt wrapper system
 * Provides standardized prompts with theme integration and consistent cancellation handling
 */

const prompts = require('../prompts');
const { getTheme } = require('./theme');
const { SPACING } = require('./standards');

/**
 * Handle prompt cancellation consistently
 */
function handleCancel(value, customMessage = 'Operation cancelled') {
  if (prompts.isCancel(value)) {
    prompts.cancel(customMessage);
    return true;
  }
  return false;
}

/**
 * Text prompt with theme and cancellation handling
 */
async function text(options = {}) {
  const theme = getTheme();
  const { message, ...restOptions } = options;

  // Add spacing before prompt
  if (SPACING.promptMessage > 0) {
    console.log();
  }

  const value = await prompts.text({
    message: message ? theme.primary(message) : message,
    ...restOptions,
  });

  if (handleCancel(value)) {
    return null;
  }

  return value;
}

/**
 * Confirm prompt with theme and cancellation handling
 */
async function confirm(options = {}) {
  const theme = getTheme();
  const { message, ...restOptions } = options;

  if (SPACING.promptMessage > 0) {
    console.log();
  }

  const value = await prompts.confirm({
    message: message ? theme.primary(message) : message,
    ...restOptions,
  });

  if (handleCancel(value)) {
    return false;
  }

  return value;
}

/**
 * Select prompt with theme and cancellation handling
 */
async function select(options = {}) {
  const theme = getTheme();
  const { message, ...restOptions } = options;

  if (SPACING.promptMessage > 0) {
    console.log();
  }

  const value = await prompts.select({
    message: message ? theme.primary(message) : message,
    ...restOptions,
  });

  if (handleCancel(value)) {
    return null;
  }

  return value;
}

/**
 * Multiselect prompt with theme and cancellation handling
 */
async function multiselect(options = {}) {
  const theme = getTheme();
  const { message, ...restOptions } = options;

  if (SPACING.promptMessage > 0) {
    console.log();
  }

  const value = await prompts.multiselect({
    message: message ? theme.primary(message) : message,
    ...restOptions,
  });

  if (handleCancel(value)) {
    return [];
  }

  return value || [];
}

/**
 * Password prompt with theme and cancellation handling
 */
async function password(options = {}) {
  const theme = getTheme();
  const { message, ...restOptions } = options;

  if (SPACING.promptMessage > 0) {
    console.log();
  }

  const value = await prompts.password({
    message: message ? theme.primary(message) : message,
    ...restOptions,
  });

  if (handleCancel(value)) {
    return null;
  }

  return value;
}

/**
 * Create a spinner with theme
 */
function spinner() {
  return prompts.spinner();
}

module.exports = {
  text,
  confirm,
  select,
  multiselect,
  password,
  spinner,
  handleCancel,
  isCancel: prompts.isCancel,
};


