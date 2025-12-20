const ora = require('ora');
const chalk = require('chalk');

/**
 * Create an ora spinner with default styling
 * @param {string} text - Initial spinner text
 * @param {object} options - Spinner options
 * @returns {ora.Ora} - Ora spinner instance
 */
const createSpinner = (text = '', options = {}) => {
  const { color = 'cyan', spinner = 'dots', ...restOptions } = options;

  return ora({
    text,
    color,
    spinner,
    ...restOptions,
  });
};

/**
 * Execute a function with a spinner
 * @param {string} text - Spinner text
 * @param {Function} fn - Async function to execute
 * @param {object} options - Spinner options
 * @returns {Promise<any>} - Result of the function
 */
const withSpinner = async (text, fn, options = {}) => {
  const spinner = createSpinner(text, options);
  spinner.start();

  try {
    const result = await fn();
    spinner.succeed(chalk.green(text.replace('...', ' completed')));
    return result;
  } catch (error) {
    spinner.fail(chalk.red(text.replace('...', ' failed')));
    throw error;
  }
};

/**
 * Common spinner presets
 */
const spinners = {
  loading: (text) => createSpinner(text, { spinner: 'dots' }),
  downloading: (text) => createSpinner(text, { spinner: 'dots12' }),
  processing: (text) => createSpinner(text, { spinner: 'bouncingBar' }),
  installing: (text) => createSpinner(text, { spinner: 'clock' }),
  building: (text) => createSpinner(text, { spinner: 'triangle' }),
};

module.exports = {
  createSpinner,
  withSpinner,
  spinners,
};

