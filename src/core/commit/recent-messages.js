const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execGit } = require('../git/executor');
const chalk = require('chalk');
const { getTheme } = require('../../utils/color-theme');

/**
 * Get recent messages file path
 */
function getRecentMessagesPath() {
  const messagesDir = path.join(os.homedir(), '.gittable');
  if (!fs.existsSync(messagesDir)) {
    fs.mkdirSync(messagesDir, { recursive: true });
  }
  return path.join(messagesDir, 'recent-messages.json');
}

/**
 * Save commit message to recent messages
 */
function saveRecentMessage(message) {
  if (!message) return;

  const messagesPath = getRecentMessagesPath();
  let messages = [];

  // Load existing messages
  if (fs.existsSync(messagesPath)) {
    try {
      messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    } catch (error) {
      messages = [];
    }
  }

  // Add new message at the beginning
  messages.unshift({
    message,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 50 messages
  messages = messages.slice(0, 50);

  // Save
  try {
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
  } catch (error) {
    // Silently fail
  }
}

/**
 * Get recent commit messages
 */
function getRecentCommitMessages(limit = 10) {
  const result = execGit(`log --format="%s" -n ${limit}`, { silent: true });

  if (!result.success || !result.output.trim()) {
    return [];
  }

  return result.output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((msg, index) => ({
      index,
      message: msg,
      short: msg.length > 60 ? `${msg.substring(0, 60)}...` : msg,
    }));
}

/**
 * Create options for recent commit message selection
 */
function createRecentMessageOptions(limit = 10) {
  const messages = getRecentCommitMessages(limit);

  if (messages.length === 0) {
    return [];
  }

  const theme = getTheme();
  return messages.map((msg, index) => ({
    value: msg.message,
    label: `${theme.primary(`#${index + 1}`)} ${chalk.gray(msg.short)}`,
    hint: 'recent commit',
  }));
}

/**
 * Extract commit type and scope from message
 */
function parseCommitMessage(message) {
  // Match conventional commit format: type(scope): subject
  const match = message.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);

  if (match) {
    return {
      type: match[1],
      scope: match[2] || null,
      subject: match[3],
    };
  }

  return {
    type: null,
    scope: null,
    subject: message,
  };
}

module.exports = {
  getRecentCommitMessages,
  createRecentMessageOptions,
  parseCommitMessage,
  saveRecentMessage,
};
