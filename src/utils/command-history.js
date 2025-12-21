const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/**
 * Get history file path
 */
function getHistoryPath() {
  const historyDir = path.join(os.homedir(), '.gittable');
  const historyFile = path.join(historyDir, 'history.json');

  // Ensure directory exists
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  return historyFile;
}

/**
 * Load command history
 */
function loadHistory(limit = 50) {
  const historyFile = getHistoryPath();

  if (!fs.existsSync(historyFile)) {
    return [];
  }

  try {
    const content = fs.readFileSync(historyFile, 'utf8');
    const history = JSON.parse(content);
    return history.slice(0, limit);
  } catch (error) {
    return [];
  }
}

/**
 * Save command to history
 */
function saveToHistory(command, args = []) {
  const historyFile = getHistoryPath();
  const history = loadHistory(100); // Keep more in file

  const entry = {
    command,
    args,
    timestamp: new Date().toISOString(),
    fullCommand: `gittable ${command} ${args.join(' ')}`.trim(),
  };

  // Remove duplicates (same command and args)
  const filtered = history.filter((h) => h.fullCommand !== entry.fullCommand);

  // Add new entry at the beginning
  filtered.unshift(entry);

  // Keep only last 100 entries
  const limited = filtered.slice(0, 100);

  try {
    fs.writeFileSync(historyFile, JSON.stringify(limited, null, 2), 'utf8');
  } catch (error) {
    // Silently fail - history is not critical
  }
}

/**
 * Clear history
 */
function clearHistory() {
  const historyFile = getHistoryPath();
  if (fs.existsSync(historyFile)) {
    fs.unlinkSync(historyFile);
  }
}

module.exports = {
  loadHistory,
  saveToHistory,
  clearHistory,
  getHistoryPath,
};
