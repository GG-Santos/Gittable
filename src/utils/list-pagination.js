const prompts = require('../ui/prompts');
const chalk = require('chalk');

/**
 * Paginate a list of items
 */
function paginateList(items, pageSize = 20, options = {}) {
  const { title = 'Items', formatItem = (item, index) => item, showTotal = true } = options;

  if (items.length === 0) {
    return [];
  }

  if (items.length <= pageSize) {
    return items;
  }

  // For now, just return first page
  // Full pagination would require interactive navigation
  const firstPage = items.slice(0, pageSize);

  if (showTotal) {
    console.log(chalk.dim(`Showing ${firstPage.length} of ${items.length} ${title.toLowerCase()}`));
    if (items.length > pageSize) {
      console.log(chalk.dim('(Use --all to show all, or filter to see more)'));
    }
  }

  return firstPage;
}

/**
 * Create paginated select options
 */
function createPaginatedOptions(items, pageSize = 20, formatItem = null) {
  if (items.length <= pageSize) {
    return items.map((item, index) =>
      formatItem ? formatItem(item, index) : { value: item, label: String(item) }
    );
  }

  // Show first page with option to show more
  const firstPage = items.slice(0, pageSize);
  const options = firstPage.map((item, index) =>
    formatItem ? formatItem(item, index) : { value: item, label: String(item) }
  );

  options.push({
    value: '__show_more__',
    label: chalk.dim(`... and ${items.length - pageSize} more (showing first ${pageSize})`),
    disabled: true,
  });

  return options;
}

module.exports = {
  paginateList,
  createPaginatedOptions,
};
