#!/usr/bin/env node

// Thin entry point - re-export from src/cli
const cli = require('./src/cli/index.js');
module.exports = cli;

// If executed directly, run the CLI main function
if (require.main === module) {
  cli.main().catch((error) => {
    const prompts = require('./src/ui/prompts');
    const chalk = require('chalk');
    prompts.cancel(chalk.red('Fatal error'));
    console.error(error);
    process.exit(1);
  });
}
