/**
 * Enhanced table system with standards
 * Provides consistent table formatting, alignment, truncation, and spacing
 */

const chalk = require('chalk');
const Table = require('cli-table3');
const { getTheme } = require('./theme');
const { TABLE_STANDARDS, SPACING } = require('./standards');

/**
 * Get terminal width with fallback
 */
function getTerminalWidth() {
  return process.stdout.columns || 80;
}

/**
 * Truncate text with ellipsis
 */
function truncate(text, maxLength) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - TABLE_STANDARDS.truncateEllipsis.length) + TABLE_STANDARDS.truncateEllipsis;
}

/**
 * Determine column alignment based on content type
 */
function determineAlignment(header, sampleData) {
  // If header suggests numeric content, right-align
  const numericKeywords = ['size', 'count', 'number', 'id', 'index', 'bytes', 'lines'];
  const headerLower = header.toLowerCase();
  if (numericKeywords.some((keyword) => headerLower.includes(keyword))) {
    return 'right';
  }

  // Check sample data
  if (sampleData && sampleData.length > 0) {
    const firstValue = sampleData[0];
    if (typeof firstValue === 'number' || (typeof firstValue === 'string' && /^\d+$/.test(firstValue))) {
      return 'right';
    }
  }

  return TABLE_STANDARDS.defaultAlign;
}

/**
 * Create a table with standards
 */
function create(options = {}) {
  const {
    headers,
    rows,
    options: tableOptions = {},
  } = options;

  const {
    align = 'left',
    truncate: shouldTruncate = true,
    maxWidth = getTerminalWidth() - 4, // Account for borders
    spacing = 'normal',
    borders = true,
    sortable = false,
    headerColor = 'primary',
  } = tableOptions;

  const theme = getTheme();
  const tableSpacing = TABLE_STANDARDS.spacing[spacing] || 0;

  if (rows.length === 0) {
    return chalk.dim('(empty)');
  }

  // Determine column alignments
  const colAligns = headers.map((header, index) => {
    if (align !== 'left' && typeof align === 'string') {
      return align;
    }
    if (Array.isArray(align)) {
      return align[index] || TABLE_STANDARDS.defaultAlign;
    }
    // Auto-detect based on header and sample data
    const sampleData = rows.map((row) => row[index]).filter((val) => val != null);
    return determineAlignment(header, sampleData);
  });

  // Truncate content if needed
  let processedRows = rows;
  if (shouldTruncate) {
    // Calculate max width per column
    const columnWidths = headers.map((header, colIndex) => {
      const headerLength = String(header).length;
      const maxDataLength = Math.max(
        ...rows.map((row) => {
          const cell = row[colIndex];
          return cell ? String(cell).length : 0;
        })
      );
      return Math.min(Math.max(headerLength, maxDataLength), Math.floor(maxWidth / headers.length));
    });

    processedRows = rows.map((row) =>
      row.map((cell, colIndex) => {
        const cellStr = String(cell || '');
        const maxColWidth = columnWidths[colIndex];
        return shouldTruncate && cellStr.length > maxColWidth ? truncate(cellStr, maxColWidth) : cellStr;
      })
    );
  }

  // Create table
  const table = new Table({
    head: headers.map((h) => {
      const headerColorFn = theme[headerColor] || theme.primary;
      return headerColorFn(chalk.bold(String(h)));
    }),
    style: {
      border: borders ? [] : [],
      head: [],
      ...tableOptions.style,
    },
    chars: borders
      ? {
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
        }
      : {
          top: '',
          'top-mid': '',
          'top-left': '',
          'top-right': '',
          bottom: '',
          'bottom-mid': '',
          'bottom-left': '',
          'bottom-right': '',
          left: '',
          'left-mid': '',
          mid: '',
          'mid-mid': '',
          right: '',
          'right-mid': '',
          middle: ' ',
        },
    colAligns,
  });

  // Add rows
  for (const row of processedRows) {
    table.push(row);
  }

  // Apply gray color to border characters
  let tableString = table.toString();
  if (borders) {
    const borderCharPattern = /([─┬┌┐┴└┘│├┼┤])/g;
    tableString = tableString.replace(borderCharPattern, (match) => theme.dim(match));
  }

  // Add spacing
  if (tableSpacing > 0) {
    const spacingLines = '\n'.repeat(tableSpacing);
    return spacingLines + tableString + spacingLines;
  }

  return tableString;
}

/**
 * Create a simple key-value list
 */
function createKeyValueList(items, options = {}) {
  const { keyColor = 'primary', valueColor = 'white' } = options;
  const theme = getTheme();
  const keyFn = theme[keyColor] || theme.primary;
  const valueFn = theme[valueColor] || chalk.white;

  const maxKeyLength = Math.max(...Object.keys(items).map((k) => k.length));

  return Object.entries(items)
    .map(([key, value]) => {
      const paddedKey = key.padEnd(maxKeyLength);
      return `${keyFn(paddedKey)} : ${valueFn(value)}`;
    })
    .join('\n');
}

module.exports = {
  create,
  createKeyValueList,
  truncate,
  getTerminalWidth,
};


