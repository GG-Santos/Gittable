const fs = require('node:fs');
const path = require('node:path');

/**
 * Get file metadata (size, modification date)
 */
function getFileMetadata(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const stats = fs.statSync(fullPath);

    return {
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      modified: stats.mtime,
      modifiedFormatted: formatDate(stats.mtime),
      isDirectory: stats.isDirectory(),
    };
  } catch (error) {
    return {
      size: 0,
      sizeFormatted: '?',
      modified: new Date(),
      modifiedFormatted: '?',
      isDirectory: false,
    };
  }
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

/**
 * Format date in relative format
 */
function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

/**
 * Get metadata for multiple files
 */
function getFilesMetadata(files) {
  return files.map((file) => ({
    file,
    ...getFileMetadata(file),
  }));
}

module.exports = {
  getFileMetadata,
  getFilesMetadata,
  formatFileSize,
  formatDate,
};
