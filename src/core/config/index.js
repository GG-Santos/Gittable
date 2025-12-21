/**
 * Config module - Re-exports configuration-related functionality
 */

const readConfigFile = require('./loader');
const { runSetup, configExists, findConfigDirectory } = require('./setup');
const { getEnabledCommands, isCommandEnabled, filterCommands } = require('./mode-filter');

module.exports = {
  // Loader
  readConfigFile,
  // Setup
  runSetup,
  configExists,
  findConfigDirectory,
  // Mode filter
  getEnabledCommands,
  isCommandEnabled,
  filterCommands,
};
