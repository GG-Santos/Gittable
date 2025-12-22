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
  const fileOptions = [];

  // Sort files for consistent ordering
  const sortedFiles = [...files].sort();

  for (const file of sortedFiles) {
    const status = statusMap[file] || '';
    const statusColor = status === 'M' ? chalk.yellow : status === '?' ? chalk.green : chalk.gray;
    
    // Extract filename and directory
    const filename = path.basename(file);
    const directory = path.dirname(file);
    
    // Format: filename (prominent) + directory (dimmed)
    // For root files, show just filename
    let label;
    if (directory === '.' || directory === '') {
      label = `${statusColor(status || ' ')} ${filename}`;
    } else {
      // Normalize directory path separators (use backslashes on Windows, forward slashes on Unix)
      const normalizedDir = process.platform === 'win32' 
        ? directory.replace(/\//g, '\\')
        : directory.replace(/\\/g, '/');
      label = `${statusColor(status || ' ')} ${filename} ${chalk.dim(normalizedDir)}`;
    }
    
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
