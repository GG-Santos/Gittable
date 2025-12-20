#!/usr/bin/env node

const clack = require('@clack/prompts');
const chalk = require('chalk');
const { promptQuestions } = require('./lib/commit/questions');
const buildCommit = require('./lib/commit/build-commit');
const readConfigFile = require('./lib/config/read-config-file');

const prompter = async (_, commit) => {
  const config = readConfigFile();
  if (!config) process.exit(1);

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
      process.exit(0);
    }

    const spinner = clack.spinner();
    spinner.start('Creating commit');

    await new Promise((resolve, reject) => {
      try {
        commit(message);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    spinner.stop('Commit created');
    clack.outro(chalk.green.bold('Success'));
  } catch (error) {
    clack.cancel(chalk.red('Failed'));
    console.error(error);
    process.exit(1);
  }
};

module.exports = { prompter };
