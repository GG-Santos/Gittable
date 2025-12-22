#!/usr/bin/env node

const ArgumentParser = require('./parser');
const router = require('./router');
const { showHelp, showInteractiveMenu } = require('./interactive');
const { showBanner } = require('../ui/components/banner');
const prompts = require('../ui/prompts');
const chalk = require('chalk');

// Enable verbose/dry-run modes if flags present
const args = process.argv.slice(2);
if (args.includes('--verbose')) {
  const { enableVerbose } = require('../utils/verbose-mode');
  enableVerbose();
}

if (args.includes('--dry-run')) {
  const { enableDryRun } = require('../utils/dry-run-mode');
  enableDryRun();
}

// Discover and register all commands
const registry = require('../commands/registry');
registry.discoverCommands();

/**
 * Main CLI entry point
 * Returns exit code instead of calling process.exit()
 */
async function main() {
  try {
    // Run first-time setup if config doesn't exist
    const { runSetup } = require('../core/config/setup');
    await runSetup();

    const parsed = ArgumentParser.parse(args);

    // Handle version flag
    if (ArgumentParser.hasVersionFlag(args)) {
      const VERSION = require('../../package.json').version;
      showBanner('GITTABLE', { version: VERSION });
      console.log();
      prompts.outro(chalk.green(`Version ${VERSION}`));
      return 0;
    }

    // Handle help flag
    if (ArgumentParser.hasHelpFlag(args) || parsed.command === 'help') {
      if (parsed.command && parsed.command !== 'help') {
        // Show help for specific command
        const helpCommand = router.resolve('help');
        if (helpCommand) {
          await helpCommand.handler([parsed.command]);
        } else {
          showHelp();
        }
      } else {
        showHelp();
      }
      return 0;
    }

    // If no arguments and TTY available, show interactive menu
    if (args.length === 0 && process.stdin.isTTY) {
      await showInteractiveMenu();
      return 0;
    }

    // If no arguments and not TTY, show help
    if (args.length === 0) {
      showHelp();
      return 0;
    }

    // Check for command chaining
    const chainCommands = ArgumentParser.parseChain(args);
    if (chainCommands.length > 1) {
      const success = await router.executeChain(chainCommands);
      return success ? 0 : 1;
    }

    // Execute single command
    if (parsed.command) {
      const success = await router.execute(parsed.command, parsed.args);
      return success ? 0 : 1;
    }

    return 0;
  } catch (error) {
    const { handleError } = require('../core/errors');
    return handleError(error, { exitCode: 1 });
  }
}

// Export main function for programmatic use
module.exports.main = main;

// Run CLI if executed directly
if (require.main === module) {
  main()
    .then((exitCode) => {
      process.exit(exitCode || 0);
    })
    .catch((error) => {
      const { handleError } = require('../core/errors');
      const code = handleError(error, { exitCode: 1 });
      process.exit(code);
    });
}
