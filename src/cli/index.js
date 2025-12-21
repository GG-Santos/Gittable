#!/usr/bin/env node

const ArgumentParser = require('./parser');
const router = require('./router');
const { showHelp, showInteractiveMenu } = require('./interactive');
const { showBanner } = require('../ui/banner');
const clack = require('@clack/prompts');
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
 */
async function main() {
  // Run first-time setup if config doesn't exist
  const { runSetup } = require('../core/config/setup');
  await runSetup();

  const parsed = ArgumentParser.parse(args);

  // Handle version flag
  if (ArgumentParser.hasVersionFlag(args)) {
    const VERSION = require('../../package.json').version;
    showBanner('GITTABLE', { version: VERSION });
    console.log();
    clack.outro(chalk.green(`Version ${VERSION}`));
    process.exit(0);
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
    process.exit(0);
  }

  // If no arguments and TTY available, show interactive menu
  if (args.length === 0 && process.stdin.isTTY) {
    try {
      await showInteractiveMenu();
      process.exit(0);
    } catch (error) {
      clack.cancel(chalk.red('Startup failed'));
      console.error(error);
      process.exit(1);
    }
  }

  // If no arguments and not TTY, show help
  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  // Check for command chaining
  const chainCommands = ArgumentParser.parseChain(args);
  if (chainCommands.length > 1) {
    await router.executeChain(chainCommands);
    return;
  }

  // Execute single command
  if (parsed.command) {
    const success = await router.execute(parsed.command, parsed.args);
    if (!success) {
      process.exit(1);
    }
  }
}

// Export main function for programmatic use
module.exports.main = main;

// Export for programmatic use (Commitizen compatibility)
const { prompter } = require('../core/commit/flow');
module.exports.prompter = prompter;

// Run CLI if executed directly
if (require.main === module) {
  main().catch((error) => {
    clack.cancel(chalk.red('Fatal error'));
    console.error(error);
    process.exit(1);
  });
}
