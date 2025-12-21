const chalk = require('chalk');

/**
 * Filter list items by search term
 */
function filterList(items, searchTerm, options = {}) {
  if (!searchTerm || !searchTerm.trim()) {
    return items;
  }

  const { searchFields = ['label', 'value'], caseSensitive = false } = options;

  const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();

  return items.filter((item) => {
    for (const field of searchFields) {
      const value = typeof item === 'object' ? item[field] : String(item);
      if (!value) continue;

      const searchValue = caseSensitive ? String(value) : String(value).toLowerCase();
      if (searchValue.includes(term)) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Highlight search term in text
 */
function highlightSearch(text, searchTerm, options = {}) {
  if (!searchTerm || !searchTerm.trim()) {
    return text;
  }

  const { caseSensitive = false, highlightColor = chalk.yellow.bold } = options;

  const term = caseSensitive ? searchTerm : searchTerm.toLowerCase();
  const textLower = caseSensitive ? text : text.toLowerCase();
  const parts = [];
  let lastIndex = 0;
  let index = textLower.indexOf(term, lastIndex);

  while (index !== -1) {
    // Add text before match
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    // Add highlighted match
    parts.push(highlightColor(text.substring(index, index + term.length)));

    lastIndex = index + term.length;
    index = textLower.indexOf(term, lastIndex);
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.join('');
}

/**
 * Sort list items
 */
function sortList(items, options = {}) {
  const { sortBy = null, order = 'asc', caseSensitive = false } = options;

  if (!sortBy) {
    return items;
  }

  const sorted = [...items].sort((a, b) => {
    let aVal = typeof a === 'object' ? a[sortBy] : a;
    let bVal = typeof b === 'object' ? b[sortBy] : b;

    if (!caseSensitive && typeof aVal === 'string' && typeof bVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
}

module.exports = {
  filterList,
  highlightSearch,
  sortList,
};
