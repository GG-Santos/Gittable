/**
 * Results and summaries display system
 * Provides standardized result displays for success, partial, and failure states
 */

const chalk = require('chalk');
const { getTheme } = require('./theme');
const { ICONS, SPACING } = require('./standards');
const messages = require('./messages');

/**
 * Display a success result
 */
function success(options = {}) {
  const { message, details = [], nextSteps = [] } = options;
  const theme = getTheme();

  console.log();
  console.log(theme.success(`${ICONS.success} ${chalk.bold(message)}`));

  if (details.length > 0) {
    console.log();
    details.forEach((detail) => {
      console.log(chalk.dim(`   ${detail}`));
    });
  }

  if (nextSteps.length > 0) {
    console.log();
    console.log(theme.primary('Next steps:'));
    nextSteps.forEach((step) => {
      console.log(theme.primary(`   → ${step}`));
    });
  }

  console.log();
}

/**
 * Display a partial result
 */
function partial(options = {}) {
  const { message, succeeded = 0, failed = 0, details = [] } = options;
  const theme = getTheme();

  console.log();
  console.log(theme.warning(`${ICONS.warning} ${chalk.bold(message)}`));
  console.log();

  if (succeeded > 0) {
    console.log(theme.success(`   ✓ ${succeeded} succeeded`));
  }
  if (failed > 0) {
    console.log(theme.error(`   ✖ ${failed} failed`));
  }

  if (details.length > 0) {
    console.log();
    details.forEach((detail) => {
      if (detail.type === 'error') {
        console.log(theme.error(`   ✖ ${detail.message}`));
      } else if (detail.type === 'success') {
        console.log(theme.success(`   ✓ ${detail.message}`));
      } else {
        console.log(chalk.dim(`   • ${detail.message}`));
      }
    });
  }

  console.log();
}

/**
 * Display a failure result
 */
function failure(options = {}) {
  const { message, errors = [], suggestions = [] } = options;
  const theme = getTheme();

  console.log();
  console.log(theme.error(`${ICONS.error} ${chalk.bold(message)}`));

  if (errors.length > 0) {
    console.log();
    errors.forEach((error) => {
      console.log(theme.error(`   ✖ ${error}`));
    });
  }

  if (suggestions.length > 0) {
    console.log();
    console.log(theme.primary('Suggestions:'));
    suggestions.forEach((suggestion) => {
      console.log(theme.primary(`   → ${suggestion}`));
    });
  }

  console.log();
}

/**
 * Display a summary result
 */
function summary(options = {}) {
  const { title, items = [], footer } = options;
  const theme = getTheme();

  console.log();
  if (title) {
    console.log(theme.primary(chalk.bold(title)));
    console.log();
  }

  items.forEach((item) => {
    const { label, value, type = 'info' } = item;
    const colorFn = theme[type] || theme.dim;
    console.log(`   ${colorFn(label)}: ${value}`);
  });

  if (footer) {
    console.log();
    console.log(chalk.dim(footer));
  }

  console.log();
}

module.exports = {
  success,
  partial,
  failure,
  summary,
};


