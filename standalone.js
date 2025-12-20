#!/usr/bin/env node

const { execSync } = require('node:child_process');
const clack = require('@clack/prompts');
const chalk = require('chalk');
const { prompter } = require('./index');

const commit = (message) => {
  try {
    execSync(`git commit -m "${message}"`, { stdio: [0, 1, 2] });
  } catch (_error) {
    clack.cancel(chalk.red('Commit failed'));
    process.exit(1);
  }
};

(async () => {
  try {
    await prompter(null, commit);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
