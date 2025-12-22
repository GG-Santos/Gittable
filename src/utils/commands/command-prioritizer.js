/**
 * Command Prioritization System
 * Defines priority levels for commands to optimize UI ordering
 */

// Command priority levels (higher number = higher priority)
const COMMAND_PRIORITY = {
  // High priority - most common commands
  status: 100,
  'status-short': 95,
  add: 90,
  commit: 85,
  push: 80,
  pull: 75,

  // Medium priority - frequently used
  branch: 60,
  checkout: 55,
  switch: 50,
  log: 45,
  diff: 40,
  show: 35,
  info: 30,

  // Lower priority - less common but still important
  fetch: 25,
  merge: 20,
  clone: 15,
  init: 10,
  config: 5,

  // Default priority for unlisted commands
  default: 0,
};

/**
 * Get priority for a command
 */
function getCommandPriority(commandName) {
  return COMMAND_PRIORITY[commandName] ?? COMMAND_PRIORITY.default;
}

/**
 * Sort commands by priority (highest first)
 */
function sortCommandsByPriority(commands) {
  return [...commands].sort((a, b) => {
    const priorityA = getCommandPriority(a.name);
    const priorityB = getCommandPriority(b.name);

    // Higher priority first
    if (priorityB !== priorityA) {
      return priorityB - priorityA;
    }

    // If same priority, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get quick actions (top priority commands) for basic mode
 */
function getQuickActions(commands, limit = 5) {
  const sorted = sortCommandsByPriority(commands);
  return sorted.slice(0, limit);
}

module.exports = {
  getCommandPriority,
  sortCommandsByPriority,
  getQuickActions,
  COMMAND_PRIORITY,
};

