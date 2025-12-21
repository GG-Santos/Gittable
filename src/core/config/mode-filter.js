/**
 * Basic mode command list
 * These are the essential commands available in Basic mode
 */
const BASIC_MODE_COMMANDS = [
  // Getting Started
  'init',
  'clone',
  'config',

  // Daily Work - Status & Changes
  'status',
  'status-short',
  'diff',
  'info',

  // Daily Work - Commit
  'add',
  'commit',
  'add-commit',
  'commit-all',

  // Working with Others - Remote
  'push',
  'pull',

  // Working with Others - Branching
  'branch',
  'checkout',
  'switch',

  // History & Inspection
  'log',
  'show',

  // Utilities
  'help',
];

/**
 * Get enabled commands based on mode
 */
function getEnabledCommands(config) {
  const mode = config?.mode || 'full';

  // If mode is full or not specified, return null (all commands enabled)
  if (mode === 'full' || !mode) {
    return null;
  }

  // If mode is basic, return basic commands
  if (mode === 'basic') {
    return BASIC_MODE_COMMANDS;
  }

  // If enabledCommands is explicitly set, use that
  if (config?.enabledCommands && Array.isArray(config.enabledCommands)) {
    if (config.enabledCommands.length === 0) {
      return null; // Empty array means all enabled
    }
    return config.enabledCommands;
  }

  // Default to all commands
  return null;
}

/**
 * Check if a command is enabled
 */
function isCommandEnabled(commandName, config) {
  const enabledCommands = getEnabledCommands(config);

  // If null, all commands are enabled
  if (enabledCommands === null) {
    return true;
  }

  return enabledCommands.includes(commandName);
}

/**
 * Filter commands array based on mode
 */
function filterCommands(commands, config) {
  const enabledCommands = getEnabledCommands(config);

  // If null, return all commands
  if (enabledCommands === null) {
    return commands;
  }

  return commands.filter((cmd) => {
    const cmdName = typeof cmd === 'string' ? cmd : cmd.name;
    return enabledCommands.includes(cmdName);
  });
}

module.exports = {
  getEnabledCommands,
  isCommandEnabled,
  filterCommands,
  BASIC_MODE_COMMANDS,
};
