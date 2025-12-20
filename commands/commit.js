const clack = require('@clack/prompts');
const chalk = require('chalk');
const { promptQuestions } = require('../lib/commit/questions');
const buildCommit = require('../lib/commit/build-commit');
const readConfigFile = require('../lib/config/read-config-file');

const { showBanner } = require('../lib/ui/banner');

module.exports = async (_args) => {
  showBanner('COMMIT');
  console.log(`${chalk.gray('├')}  ${chalk.cyan.bold('Create Commit')}`);

  // Check if TTY is available for interactive prompts
  if (!process.stdin.isTTY) {
    clack.cancel(chalk.red('Interactive mode required'));
    console.log(chalk.yellow('This command requires interactive input.'));
    console.log(chalk.gray('Please use: git commit -m "message" for non-interactive commits'));
    process.exit(1);
  }

  const config = readConfigFile();
  if (!config) {
    clack.cancel(chalk.red('No configuration found'));
    process.exit(1);
  }

  config.subjectLimit = config.subjectLimit || 100;

  try {
    const answers = await promptQuestions(config);
    const message = buildCommit(answers, config);

    clack.note(message, chalk.bold('Commit Preview'));

    const action = await clack.select({
      message: chalk.yellow('Proceed?'),
      options: [
        { value: 'yes', label: chalk.green('Commit') },
        { value: 'no', label: chalk.red('Cancel') },
      ],
    });

    if (clack.isCancel(action) || action === 'no') {
      clack.cancel(chalk.yellow('Cancelled'));
      return;
    }

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
