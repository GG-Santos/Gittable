/**
 * UI Components module
 * Reusable UI components
 */

const banner = require('./banner');
const status = require('./status');
const table = require('./table');

module.exports = {
  banner,
  status,
  table,
  // Direct exports for convenience
  createBanner: banner.createBanner,
  showBanner: banner.showBanner,
  displayStatus: status.displayStatus,
  STATUS_COLORS: status.STATUS_COLORS,
  STATUS_LABELS: status.STATUS_LABELS,
  createTable: table.createTable,
  createKeyValueList: table.createKeyValueList,
};

