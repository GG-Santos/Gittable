const { execGit } = require('../git/executor');
const { getStatus } = require('../git/status');
const path = require('node:path');

/**
 * Detect commit type based on changed files
 */
function suggestCommitType(changedFiles) {
  if (!changedFiles || changedFiles.length === 0) {
    return null;
  }

  const fileExtensions = {
    test: ['.test.js', '.test.ts', '.spec.js', '.spec.ts', '__tests__', 'test/', 'tests/'],
    docs: ['.md', '.txt', 'docs/', 'README'],
    style: ['.css', '.scss', '.sass', '.less', '.styl'],
    config: ['.json', '.yaml', '.yml', 'config/', '.config.', 'package.json'],
    build: ['build/', 'dist/', '.babelrc', 'webpack', 'rollup', 'vite'],
  };

  const fileTypes = {
    test: 0,
    docs: 0,
    style: 0,
    config: 0,
    build: 0,
  };

  for (const file of changedFiles) {
    const lowerFile = file.toLowerCase();
    const ext = path.extname(lowerFile);
    const dir = path.dirname(lowerFile);

    // Check extensions and paths
    for (const [type, patterns] of Object.entries(fileExtensions)) {
      for (const pattern of patterns) {
        if (lowerFile.includes(pattern) || ext === pattern || dir.includes(pattern)) {
          fileTypes[type]++;
          break;
        }
      }
    }
  }

  // Find most common type
  const maxCount = Math.max(...Object.values(fileTypes));
  if (maxCount === 0) {
    return null;
  }

  const suggestedType = Object.entries(fileTypes).find(([_, count]) => count === maxCount)?.[0];

  // Map to commit types
  const typeMap = {
    test: 'test',
    docs: 'docs',
    style: 'style',
    config: 'chore',
    build: 'chore',
  };

  return typeMap[suggestedType] || null;
}

/**
 * Get changed files for context-aware suggestions
 */
function getChangedFiles() {
  const status = getStatus();
  if (!status) {
    return [];
  }

  const allFiles = [
    ...status.staged.map((f) => f.file),
    ...status.unstaged.map((f) => f.file),
    ...status.untracked,
  ];

  return allFiles;
}

/**
 * Detect breaking changes from commit message
 */
function detectBreakingChanges(message) {
  if (!message) {
    return false;
  }

  const breakingKeywords = [
    'breaking',
    'break',
    'removed',
    'remove',
    'deprecated',
    'deprecate',
    'migration',
    'migrate',
    'incompatible',
  ];

  const lowerMessage = message.toLowerCase();
  return breakingKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Get context-aware commit suggestions
 */
function getCommitSuggestions() {
  const changedFiles = getChangedFiles();
  const suggestedType = suggestCommitType(changedFiles);
  const hasTestFiles = changedFiles.some(
    (file) =>
      file.includes('test') ||
      file.includes('spec') ||
      file.endsWith('.test.js') ||
      file.endsWith('.spec.js')
  );

  return {
    suggestedType,
    changedFiles,
    hasTestFiles,
    fileCount: changedFiles.length,
  };
}

module.exports = {
  suggestCommitType,
  getChangedFiles,
  detectBreakingChanges,
  getCommitSuggestions,
};
