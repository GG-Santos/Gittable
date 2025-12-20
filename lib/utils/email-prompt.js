const emailPrompt = require('email-prompt');
const chalk = require('chalk');
const clack = require('@clack/prompts');

/**
 * Prompt for email address with autocompletion
 * @param {object} options - Email prompt options
 * @returns {Promise<string>} - Email address
 */
const promptEmail = async (options = {}) => {
  const {
    start = '> Enter your email: ',
    forceLowerCase = true,
    suggestionColor = 'gray',
  } = options;

  try {
    const email = await emailPrompt({
      start,
      forceLowerCase,
      suggestionColor,
    });
    return email;
  } catch (err) {
    if (err.message?.includes('Aborted')) {
      clack.cancel(chalk.yellow('Email input cancelled'));
      return null;
    }
    throw err;
  }
};

/**
 * Prompt for email with validation and confirmation
 * @param {object} options - Options
 * @returns {Promise<string|null>} - Email address or null if cancelled
 */
const promptEmailWithConfirmation = async (options = {}) => {
  const email = await promptEmail(options);

  if (!email) {
    return null;
  }

  // Show confirmation
  const confirm = await clack.confirm({
    message: `Use email: ${chalk.cyan(email)}?`,
    initialValue: true,
  });

  if (clack.isCancel(confirm) || !confirm) {
    clack.cancel(chalk.yellow('Email not set'));
    return null;
  }

  return email;
};

module.exports = {
  promptEmail,
  promptEmailWithConfirmation,
};

