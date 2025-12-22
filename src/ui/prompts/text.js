/**
 * Text prompt implementation
 */

const chalk = require('chalk');
const { TextPrompt } = require('./core');
const { getStateSymbol, SYMBOLS, getPrimaryColor } = require('./theme');

/**
 * Text prompt
 */
async function text(options = {}) {
  const { message, validate, placeholder, defaultValue, initialValue } = options;
  const primaryColor = getPrimaryColor();

  return new TextPrompt({
    validate,
    placeholder,
    defaultValue,
    initialValue,
    render() {
      const symbol = getStateSymbol(this.state);
      const promptLine = `${chalk.gray(SYMBOLS.BAR)}\n${symbol}  ${message}\n`;

      const placeholderText = placeholder
        ? chalk.inverse(placeholder[0]) + chalk.dim(placeholder.slice(1))
        : chalk.inverse(chalk.hidden('_'));

      const valueText = this.value ? this.valueWithCursor : placeholderText;

      switch (this.state) {
        case 'error':
          return `${promptLine.trim()}\n${chalk.yellow(SYMBOLS.BAR)}  ${valueText}\n${chalk.yellow(SYMBOLS.BAR_END)}  ${chalk.yellow(this.error)}\n`;
        case 'submit':
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${chalk.dim(this.value || placeholder)}`;
        case 'cancel':
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${chalk.strikethrough(chalk.dim(this.value || ''))}${this.value?.trim() ? `\n${chalk.gray(SYMBOLS.BAR)}` : ''}\n`;
        default:
          return `${promptLine}${primaryColor(SYMBOLS.BAR)}  ${valueText}\n${primaryColor(SYMBOLS.BAR_END)}`;
      }
    },
  }).prompt();
}

module.exports = text;

