/**
 * Get enabled commands based on config
 * Mode system has been removed - all commands are always enabled
 * Only enabledCommands array in config can filter commands
 */
function getEnabledCommands(config) {
  // If enabledCommands is explicitly set, use that
  if (config?.enabledCommands && Array.isArray(config.enabledCommands)) {
    if (config.enabledCommands.length === 0) {
      return null; // Empty array means all enabled
    }
    return config.enabledCommands;
  }

  // Default to all commands enabled
  return null;
}

/**
 * Check if a command is enabled
 * All commands are enabled by default (mode system removed)
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
 * Filter commands array based on config
 * Mode system has been removed - only enabledCommands array filters
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
};

