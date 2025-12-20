const chalk = require('chalk');

let terminalLink;
try {
  const terminalLinkModule = require('terminal-link');
  // Handle ES module default export
  terminalLink = terminalLinkModule.default || terminalLinkModule;
  // Check if it's actually a function
  if (typeof terminalLink !== 'function') {
    terminalLink = null;
  }
} catch (_e) {
  // terminal-link not installed, will use fallback
  terminalLink = null;
}

/**
 * Create a clickable terminal link with fallback
 * @param {string} text - Link text
 * @param {string} url - Link URL
 * @param {object} options - Options for styling
 * @returns {string} - Formatted link
 */
const createLink = (text, url, options = {}) => {
  const { color = 'cyan', fallback = true } = options;

  let link;
  if (terminalLink && typeof terminalLink === 'function') {
    link = terminalLink(text, url, { fallback });
  } else {
    // Fallback to plain text with URL in parentheses
    link = fallback ? `${text} (${url})` : text;
  }

  if (color && link !== text) {
    return chalk[color](link);
  }

  return link;
};

/**
 * Create multiple links separated by a delimiter
 * @param {Array<{text: string, url: string}>} links - Array of link objects
 * @param {string} separator - Separator between links
 * @returns {string} - Formatted links
 */
const createLinks = (links, separator = ' | ') => {
  return links.map(({ text, url, color }) => createLink(text, url, { color })).join(separator);
};

module.exports = {
  createLink,
  createLinks,
};
