const { getCurrentBranch, execGit } = require('../core/git');
const chalk = require('chalk');

/**
 * Extract issue number from branch name
 */
function extractIssueFromBranch(branchName = null) {
  const branch = branchName || getCurrentBranch();
  if (!branch) {
    return null;
  }

  // Common patterns: issue-123, feature/ISSUE-123, bugfix/123, etc.
  const patterns = [
    /(?:issue|fix|bug|feature|feat)[\/-]?(\d+)/i,
    /(\d+)/, // Simple number
    /([A-Z]+-\d+)/, // JIRA style: PROJ-123
  ];

  for (const pattern of patterns) {
    const match = branch.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Suggest issue number from branch
 */
function suggestIssueNumber(branchName = null) {
  return extractIssueFromBranch(branchName);
}

/**
 * Validate issue number format
 */
function validateIssueNumber(issueNumber, format = null) {
  if (!issueNumber) {
    return { valid: true }; // Optional
  }

  // Default validation: alphanumeric with optional dash
  if (!format) {
    const isValid = /^[A-Z0-9-]+$/i.test(issueNumber);
    return {
      valid: isValid,
      error: isValid ? null : 'Issue number should be alphanumeric (e.g., 123, ISSUE-123)',
    };
  }

  // Custom format validation
  try {
    const regex = new RegExp(format);
    const isValid = regex.test(issueNumber);
    return {
      valid: isValid,
      error: isValid ? null : `Issue number should match format: ${format}`,
    };
  } catch (error) {
    return {
      valid: true, // Don't validate if regex is invalid
      error: null,
    };
  }
}

/**
 * Format issue reference for commit message
 */
function formatIssueReference(issueNumber, prefix = '#') {
  if (!issueNumber) {
    return '';
  }

  return `${prefix}${issueNumber}`;
}

/**
 * Auto-link issues in commit message
 */
function autoLinkIssues(message, patterns = null) {
  if (!message) {
    return message;
  }

  // Default patterns for common issue trackers
  const defaultPatterns = [
    { pattern: /#(\d+)/g, format: '#$1' }, // GitHub style
    { pattern: /([A-Z]+-\d+)/g, format: '$1' }, // JIRA style
  ];

  const issuePatterns = patterns || defaultPatterns;

  // Issues are already linked if they match patterns
  // This function can be extended to add actual links
  return message;
}

/**
 * Detect repository type and create issue links
 */
function createIssueLink(issueNumber, branchName = null) {
  if (!issueNumber) {
    return null;
  }

  const { execGit } = require('../core/git');

  // Try to detect remote URL
  const remoteResult = execGit('remote get-url origin', { silent: true });
  if (!remoteResult.success) {
    return null;
  }

  const remoteUrl = remoteResult.output.trim();

  // GitHub
  if (remoteUrl.includes('github.com')) {
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      return `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
    }
  }

  // GitLab
  if (remoteUrl.includes('gitlab.com')) {
    const match = remoteUrl.match(/gitlab\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (match) {
      const [, owner, repo] = match;
      return `https://gitlab.com/${owner}/${repo}/-/issues/${issueNumber}`;
    }
  }

  // JIRA (if configured)
  const { getPreference } = require('./user-preferences');
  const jiraUrl = getPreference('jira.url', null);
  if (jiraUrl && /^[A-Z]+-\d+$/i.test(issueNumber)) {
    return `${jiraUrl}/browse/${issueNumber}`;
  }

  return null;
}

/**
 * Format issue reference with link
 */
function formatIssueReferenceWithLink(issueNumber, branchName = null) {
  const link = createIssueLink(issueNumber, branchName);
  const reference = formatIssueReference(issueNumber);

  if (link) {
    return `${reference} (${link})`;
  }

  return reference;
}

module.exports = {
  extractIssueFromBranch,
  suggestIssueNumber,
  validateIssueNumber,
  formatIssueReference,
  autoLinkIssues,
  createIssueLink,
  formatIssueReferenceWithLink,
};
