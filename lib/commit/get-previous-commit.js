const fs = require('node:fs');

const getPreviousCommit = () => {
  const path = './.git/COMMIT_EDITMSG';
  if (!fs.existsSync(path)) return null;

  return fs
    .readFileSync(path, 'utf-8')
    .replace(/^#.*/gm, '')
    .replace(/^\s*[\r\n]/gm, '')
    .replace(/[\r\n]$/, '')
    .split(/\r\n|\r|\n/);
};

module.exports = getPreviousCommit;
