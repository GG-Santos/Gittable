const { execGit } = require('./executor');

/**
 * Get commit log
 */
const getLog = (limit = 20, format = '%h|%an|%ar|%s') => {
  const result = execGit(`log --format="${format}" -n ${limit}`, { silent: true });
  if (!result.success) return [];

  return result.output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, author, date, ...messageParts] = line.split('|');
      return {
        hash,
        author,
        date,
        message: messageParts.join('|'),
      };
    });
};

/**
 * Get stash list
 */
const getStashList = () => {
  const result = execGit('stash list --format="%gd|%ar|%gs"', { silent: true });
  if (!result.success) return [];

  return result.output
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|');
      const ref = parts[0] || '';
      const date = parts[1] || '';
      const message = parts.slice(2).join('|') || '';
      return {
        ref,
        date,
        message,
      };
    });
};

module.exports = {
  getLog,
  getStashList,
};
