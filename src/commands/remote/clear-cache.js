const ui = require('../../ui/framework');
const { showCommandHeader } = require('../../utils/command-helpers');
const { clearAllCaches } = require('../../utils/cache');

/**
 * Clear all caches
 */
module.exports = async (_args) => {
  showCommandHeader('CLEAR-CACHE', 'Clear Cache');

  clearAllCaches();

  ui.success('All caches cleared');
};
