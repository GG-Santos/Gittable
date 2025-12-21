#!/usr/bin/env node

// Thin entry point - re-export from src/cli
const cli = require('./src/cli/index.js');
module.exports = cli;

// If executed directly, run the CLI main function
if (require.main === module) {
  cli.main().catch((error) => {
    const clack = require('@clack/prompts');
    const chalk = require('chalk');
    clack.cancel(chalk.red('Fatal error'));
    console.error(error);
    process.exit(1);
  });
}
