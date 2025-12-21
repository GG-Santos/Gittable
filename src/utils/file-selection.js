const path = require('node:path');
const chalk = require('chalk');
const { getFileMetadata } = require('./file-metadata');

/**
 * Group files by directory for better organization
 */
function groupFilesByDirectory(files) {
  const groups = {};
  const rootFiles = [];

  for (const file of files) {
    const dir = path.dirname(file);

    if (dir === '.' || dir === '') {
      rootFiles.push(file);
    } else {
      if (!groups[dir]) {
        groups[dir] = [];
      }
      groups[dir].push(file);
    }
  }

  return { groups, rootFiles };
}

/**
 * Create file selection options with directory grouping
 */
function createFileOptions(files, statusMap = {}, options = {}) {
  const { showMetadata = false } = options;
  const { groups, rootFiles } = groupFilesByDirectory(files);
  const fileOptions = [];

  // Add root files first
  for (const file of rootFiles) {
    const status = statusMap[file] || '';
    const statusColor = status === 'M' ? chalk.yellow : status === '?' ? chalk.green : chalk.gray;

    const label = `${statusColor(status || ' ')} ${file}`;
    let hint = status === 'M' ? 'modified' : status === '?' ? 'untracked' : '';

    if (showMetadata) {
      const metadata = getFileMetadata(file);
      hint = `${hint ? `${hint}, ` : ''}${metadata.sizeFormatted}, ${metadata.modifiedFormatted}`;
    }

    fileOptions.push({
      value: file,
      label,
      hint,
    });
  }

  // Add grouped files by directory
  const sortedDirs = Object.keys(groups).sort();
  for (const dir of sortedDirs) {
    // Add directory header (non-selectable)
    fileOptions.push({
      value: `__dir__${dir}`,
      label: chalk.dim(`📁 ${dir}/`),
      hint: `${groups[dir].length} file(s)`,
      disabled: true,
    });

    // Add files in this directory
    for (const file of groups[dir].sort()) {
      const status = statusMap[file] || '';
      const statusColor = status === 'M' ? chalk.yellow : status === '?' ? chalk.green : chalk.gray;
      const relativePath = path.relative(dir, file) || path.basename(file);

      const label = `  ${statusColor(status || ' ')} ${relativePath}`;
      let hint = status === 'M' ? 'modified' : status === '?' ? 'untracked' : '';

      if (showMetadata) {
        const metadata = getFileMetadata(file);
        hint = `${hint ? `${hint}, ` : ''}${metadata.sizeFormatted}, ${metadata.modifiedFormatted}`;
      }

      fileOptions.push({
        value: file,
        label,
        hint,
      });
    }
  }

  return fileOptions;
}

/**
 * Filter file options by search term
 */
function filterFileOptions(options, searchTerm) {
  if (!searchTerm) {
    return options;
  }

  const lowerSearch = searchTerm.toLowerCase();
  return options.filter((opt) => {
    if (opt.disabled) {
      return true; // Keep directory headers
    }
    return (
      opt.value.toLowerCase().includes(lowerSearch) || opt.label.toLowerCase().includes(lowerSearch)
    );
  });
}

module.exports = {
  groupFilesByDirectory,
  createFileOptions,
  filterFileOptions,
};
