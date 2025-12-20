const clack = require('@clack/prompts');
const chalk = require('chalk');
const { promptQuestions, CancelError } = require('../lib/commit/questions');
const buildCommit = require('../lib/commit/build-commit');
const readConfigFile = require('../lib/config/read-config-file');
const { showCommandHeader, requireTTY, handleCancel } = require('../lib/utils/command-helpers');

/**
 * Commit command - Framework agnostic commit creation with interactive prompts
 * Supports going back to previous questions during the commit flow
 */
module.exports = async (_args) => {
  showCommandHeader('COMMIT', 'Create Commit');

  requireTTY('Please use: git commit -m "message" for non-interactive commits');

  const config = readConfigFile();
  if (!config) {
    clack.cancel(chalk.red('No configuration found'));
    process.exit(1);
  }

  config.subjectLimit = config.subjectLimit || 100;

  let message;
  try {
    const answers = await promptQuestions(config);
    message = buildCommit(answers, config);

    clack.note(message, chalk.bold('Commit Preview'));

    const action = await clack.select({
      message: chalk.yellow('Proceed?'),
      options: [
        { value: 'yes', label: chalk.green('Commit') },
        { value: 'no', label: chalk.red('Cancel') },
      ],
    });

    if (handleCancel(action) || action === 'no') return;
  } catch (error) {
    if (error instanceof CancelError || error.isCancel) {
      clack.cancel(chalk.yellow('Operation cancelled'));
      return;
    }
    throw error;
  }

  try {
    const { execSync } = require('node:child_process');
    const spinner = clack.spinner();
    spinner.start('Creating commit...');

    let result;
    try {
      execSync('git commit -F -', {
        input: message,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      result = { success: true };
    } catch (error) {
      result = {
        success: false,
        error: error.stderr?.toString() || error.message,
      };
    }

    spinner.stop();

    if (result.success) {
      clack.outro(chalk.green.bold('Commit created successfully'));
    } else {
      clack.cancel(chalk.red('Failed to create commit'));
      console.error(result.error);
      process.exit(1);
    }
  } catch (error) {
    clack.cancel(chalk.red('Failed to create commit'));
    console.error(error);
    process.exit(1);
  }
};
