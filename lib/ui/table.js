const chalk = require('chalk');
const Table = require('cli-table3');

/**
 * Create a simple table display using cli-table3
 */
const createTable = (headers, rows, options = {}) => {
  const { headerColor = 'cyan', align = 'left', style = {} } = options;

  if (rows.length === 0) {
    return chalk.dim('(empty)');
  }

  // Create table with cli-table3
  const table = new Table({
    head: headers.map((h) => chalk[headerColor].bold(h)),
    style: {
      border: [],
      head: [],
      ...style,
    },
    chars: {
      top: '─',
      'top-mid': '┬',
      'top-left': '├',
      'top-right': '┐',
      bottom: '─',
      'bottom-mid': '┴',
      'bottom-left': '├',
      'bottom-right': '┘',
      left: '│',
      'left-mid': '├',
      mid: '─',
      'mid-mid': '┼',
      right: '│',
      'right-mid': '┤',
      middle: '│',
    },
    colAligns: headers.map(() => align),
  });

  // Add rows
  for (const row of rows) {
    table.push(row);
  }

  // Apply gray color to border characters
  const tableString = table.toString();
  // Match border characters (horizontal lines, vertical lines, corners, junctions)
  // This regex matches border chars at the start/end of lines or as standalone border elements
  const borderCharPattern = /([─┬┌┐┴└┘│├┼┤])/g;
  const result = tableString.replace(borderCharPattern, (match) => chalk.gray(match));

  return result;
};

/**
 * Create a key-value list
 */
const createKeyValueList = (items, options = {}) => {
  const { keyColor = 'cyan', valueColor = 'white' } = options;

  const maxKeyLength = Math.max(...Object.keys(items).map((k) => k.length));

  return Object.entries(items)
    .map(([key, value]) => {
      const paddedKey = key.padEnd(maxKeyLength);
      return `${chalk[keyColor](paddedKey)} : ${chalk[valueColor](value)}`;
    })
    .join('\n');
};

module.exports = {
  createTable,
  createKeyValueList,
};
