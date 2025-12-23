const chalk = require('chalk');
const stripAnsiModule = require('strip-ansi');
const stripAnsi = stripAnsiModule.default || stripAnsiModule;

/**
 * Sort table rows by column
 */
function sortTableRows(rows, columnIndex, order = 'asc') {
  if (columnIndex < 0 || columnIndex >= (rows[0]?.length || 0)) {
    return rows;
  }

  const sorted = [...rows].sort((a, b) => {
    const aVal = a[columnIndex];
    const bVal = b[columnIndex];

    // Extract text from chalk-colored strings
    const aText = typeof aVal === 'string' ? stripAnsi(aVal) : String(aVal);
    const bText = typeof bVal === 'string' ? stripAnsi(bVal) : String(bVal);

    // Try numeric comparison first
    const aNum = Number.parseFloat(aText);
    const bNum = Number.parseFloat(bText);

    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      return order === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // String comparison
    const comparison = aText.localeCompare(bText);
    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Create sortable table header
 */
function createSortableHeader(headers, currentSort = null) {
  return headers.map((header, index) => {
    if (currentSort && currentSort.column === index) {
      const arrow = currentSort.order === 'asc' ? ' ↑' : ' ↓';
      return header + chalk.dim(arrow);
    }
    return header;
  });
}

module.exports = {
  sortTableRows,
  stripAnsi,
  createSortableHeader,
};
