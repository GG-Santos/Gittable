const chalk = require('chalk');

// ASCII art letter definitions from ASCII ART Reference.md
const ASCII_LETTERS = {
  A: [
    ' ______      ',
    '/\\  __ \\     ',
    '\\ \\  __ \\    ',
    ' \\ \\_\\ \\_\\   ',
    '  \\/_/\\/_/   ',
  ],
  B: [' ______      ', '/\\  == \\     ', '\\ \\  __<     ', ' \\ \\_____\\   ', '  \\/_____/   '],
  C: [' ______     ', '/\\  ___\\    ', '\\ \\ \\____   ', ' \\ \\_____\\  ', '  \\/_____/  '],
  D: [' _____       ', '/\\  __-.     ', '\\ \\ \\/\\ \\    ', ' \\ \\____-    ', '  \\/____/    '],
  E: [' ______      ', '/\\  ___\\     ', '\\ \\  __\\     ', ' \\ \\_____\\   ', '  \\/_____/   '],
  F: [' ______     ', '/\\  ___\\    ', '\\ \\  __\\    ', ' \\ \\_\\      ', '  \\/_/      '],
  G: [
    ' ______      ',
    '/\\  ___\\     ',
    '\\ \\ \\__ \\    ',
    ' \\ \\_____\\   ',
    '  \\/_____/   ',
  ],
  H: [
    ' __  __      ',
    '/\\ \\_\\ \\     ',
    '\\ \\  __ \\    ',
    ' \\ \\_\\ \\_\\   ',
    '  \\/_/\\/_/   ',
  ],
  I: [' __     ', '/\\ \\    ', '\\ \\ \\   ', ' \\ \\_\\  ', '  \\/_/  '],
  J: ['   __        ', '  /\\ \\       ', ' _\\_\\ \\      ', '/\\_____\\     ', '\\/_____/     '],
  K: [
    ' __  __      ',
    '/\\ \\/ /      ',
    '\\ \\  _"-.    ',
    ' \\ \\_\\ \\_\\   ',
    '  \\/_/\\/_/   ',
  ],
  L: [' __          ', '/\\ \\         ', '\\ \\ \\____    ', ' \\ \\_____\\   ', '  \\/_____/   '],
  M: [
    ' __    __    ',
    '/\\ "-./  \\   ',
    '\\ \\ \\-./\\ \\  ',
    ' \\ \\_\\ \\ \\_\\ ',
    '  \\/_/  \\/_/ ',
  ],
  N: [
    ' __   __     ',
    '/\\ "-.\\ \\    ',
    '\\ \\ \\-.  \\   ',
    ' \\ \\_\\\\"\\_\\  ',
    '  \\/_/ \\/_/  ',
  ],
  O: [' ______     ', '/\\  __ \\    ', '\\ \\ \\/\\ \\   ', ' \\ \\_____\\  ', '  \\/_____/  '],
  P: [' ______      ', '/\\  == \\     ', '\\ \\  _-/     ', ' \\ \\_\\       ', '  \\/_/       '],
  Q: [
    ' ______      ',
    '/\\  __ \\     ',
    '\\ \\ \\/\\_\\    ',
    ' \\ \\___\\_\\   ',
    '  \\/___/_/   ',
  ],
  R: [
    ' ______      ',
    '/\\  == \\     ',
    '\\ \\  __<     ',
    ' \\ \\_\\ \\_\\   ',
    '  \\/_/ /_/   ',
  ],
  S: [' ______      ', '/\\  ___\\     ', '\\ \\___  \\    ', ' \\/\\_____\\   ', '  \\/_____/   '],
  T: [' ______      ', '/\\__  _\\     ', '\\/_/\\ \\/     ', '   \\ \\_\\     ', '    \\/_/     '],
  U: [
    ' __  __      ',
    '/\\ \\/\\ \\     ',
    '\\ \\ \\_\\ \\    ',
    ' \\ \\_____\\   ',
    '  \\/_____/   ',
  ],
  V: [' __   __     ', '/\\ \\ / /     ', "\\ \\ \\'/      ", ' \\ \\__|      ', '  \\/_/       '],
  W: [
    ' __     __   ',
    '/\\ \\  _ \\ \\  ',
    '\\ \\ \\/ ".\\ \\ ',
    ' \\ \\__/".~\\_\\',
    '  \\/_/   \\/_/',
  ],
  X: [
    ' __  __      ',
    '/\\_\\_\\_\\     ',
    '\\/_/\\_\\/_    ',
    '  /\\_\\/\\_\\   ',
    '  \\/_/\\/_/   ',
  ],
  Y: [
    ' __  __      ',
    '/\\ \\_\\ \\     ',
    '\\ \\____ \\    ',
    ' \\/\\_____\\   ',
    '  \\/_____/   ',
  ],
  Z: [' ______      ', '/\\___  \\     ', '\\/_/  /__    ', '  /\\_____\\   ', '  \\/_____/   '],
};

/**
 * Generate ASCII art for a word
 * @param {string} word - The word to convert to ASCII art
 * @param {object} options - Options for formatting
 * @param {string} options.color - Chalk color to apply (default: 'cyan')
 * @returns {string} - Formatted ASCII art
 */
function generateASCII(word, options = {}) {
  const { color = 'cyan' } = options;
  const upperWord = word.toUpperCase();
  const letters = upperWord.split('');

  // Filter out non-letter characters (spaces, numbers, etc.)
  const validLetters = letters.filter((char) => ASCII_LETTERS[char]);

  if (validLetters.length === 0) {
    return '';
  }

  // Get the height of ASCII art (all letters have the same height)
  const height = ASCII_LETTERS[validLetters[0]].length;

  // Combine letters horizontally
  const lines = [];
  for (let i = 0; i < height; i++) {
    const line = validLetters.map((letter) => ASCII_LETTERS[letter][i]).join('');
    lines.push(line);
  }

  // Apply color if specified
  const coloredLines = color ? lines.map((line) => chalk[color](line)) : lines;

  return coloredLines.join('\n');
}

/**
 * Get ASCII art for a command name
 * @param {string} commandName - The command name
 * @param {object} options - Options for formatting
 * @returns {string} - Formatted ASCII art
 */
function getCommandASCII(commandName, options = {}) {
  return generateASCII(commandName, options);
}

module.exports = {
  generateASCII,
  getCommandASCII,
  ASCII_LETTERS,
};
