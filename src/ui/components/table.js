/**
 * Table component
 * Maintains backward compatibility while using the framework
 */

const ui = require('../framework');

/**
 * Create a simple table display using framework
 */
const createTable = (headers, rows, options = {}) => {
  const { headerColor = 'primary', align = 'left', style = {}, ...restOptions } = options;

  return ui.table.create({
    headers,
    rows,
    options: {
      align,
      headerColor,
      style,
      ...restOptions,
    },
  });
};

/**
 * Create a key-value list using framework
 */
const createKeyValueList = (items, options = {}) => {
  return ui.table.createKeyValueList(items, options);
};

module.exports = {
  createTable,
  createKeyValueList,
};

