const wrap = require('word-wrap');

const DEFAULTS = {
  separator: ': ',
  maxWidth: 100,
  breakChar: '|',
};

const wrapText = (text, width = DEFAULTS.maxWidth) =>
  text ? wrap(text, { trim: true, newline: '\n', indent: '', width }) : '';

const escapeChars = (str) => str.replace(/[`"\\$!<>&]/g, (char) => `\\${char}`);

const addBreaklines = (text, char = DEFAULTS.breakChar) => text.split(char).join('\n');

const buildCommit = (answers, config) => {
  const parts = [];

  // Build header: type(scope): subject
  let header = config.typePrefix || '';
  header += answers.type;
  header += config.typeSuffix || '';

  if (answers.scope) {
    header += `(${answers.scope})`;
  }

  header += config.subjectSeparator || DEFAULTS.separator;

  if (config.prependTicketToHead && answers.ticketNumber) {
    const ticket = answers.ticketNumber.trim();
    const prefix = config.ticketNumberPrefix || '';
    const suffix = config.ticketNumberSuffix || '';
    header = `${prefix}${ticket}${suffix} ${header}`;
  }

  header += answers.subject.slice(0, config.subjectLimit || 100);

  parts.push(header);

  // Add body
  if (answers.body) {
    const body = wrapText(addBreaklines(answers.body, config.breaklineChar));
    parts.push('', body);
  }

  // Add breaking changes
  if (answers.breaking) {
    const prefix = config.breakingPrefix || 'BREAKING CHANGE:';
    const breaking = wrapText(answers.breaking);
    parts.push('', `${prefix}\n${breaking}`);
  }

  // Add footer
  if (answers.footer) {
    const prefix = config.footerPrefix === '' ? '' : config.footerPrefix || 'ISSUES CLOSED:';
    const footer = wrapText(addBreaklines(answers.footer, config.breaklineChar));
    parts.push('', prefix ? `${prefix} ${footer}` : footer);
  }

  return escapeChars(parts.join('\n'));
};

module.exports = buildCommit;
