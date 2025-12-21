/**
 * CLI Argument Parser
 * Handles argument parsing and flag extraction
 */
class ArgumentParser {
  /**
   * Parse command line arguments
   */
  static parse(args) {
    const parsed = {
      command: null,
      args: [],
      flags: {},
      raw: args,
    };

    if (args.length === 0) {
      return parsed;
    }

    // Extract global flags first
    const globalFlags = ['--verbose', '--dry-run', '--help', '-h', '--version', '-v'];
    const filteredArgs = [];

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (globalFlags.includes(arg)) {
        parsed.flags[arg.replace(/^--?/, '')] = true;
      } else if (arg === '&&' || arg === '|') {
        // Command chaining operator
        parsed.flags.chainOperator = arg;
        parsed.flags.chainIndex = i;
      } else {
        filteredArgs.push(arg);
      }
    }

    // First non-flag argument is the command
    if (filteredArgs.length > 0) {
      parsed.command = filteredArgs[0].toLowerCase();
      parsed.args = filteredArgs.slice(1);
    }

    return parsed;
  }

  /**
   * Parse command chaining
   */
  static parseChain(args) {
    const commands = [];
    let currentCommand = [];
    let currentOperator = null;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '&&' || arg === '|') {
        if (currentCommand.length > 0) {
          commands.push({
            args: currentCommand,
            operator: currentOperator,
          });
          currentCommand = [];
        }
        currentOperator = arg;
      } else {
        currentCommand.push(arg);
      }
    }

    if (currentCommand.length > 0) {
      commands.push({
        args: currentCommand,
        operator: currentOperator,
      });
    }

    return commands;
  }

  /**
   * Check if help flag is present
   */
  static hasHelpFlag(args) {
    return args.includes('--help') || args.includes('-h');
  }

  /**
   * Check if version flag is present
   */
  static hasVersionFlag(args) {
    return args.includes('--version') || (args.length === 1 && args[0] === '-v');
  }
}

module.exports = ArgumentParser;
