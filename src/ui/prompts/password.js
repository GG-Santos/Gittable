/**
 * Password prompt implementation
 */

const chalk = require('chalk');
const { PasswordPrompt } = require('./core');
const { getStateSymbol, SYMBOLS, getPrimaryColor } = require('./theme');

/**
 * Password prompt
 */
async function password(options = {}) {
  const { message, validate, mask = SYMBOLS.PASSWORD_MASK } = options;
  const primaryColor = getPrimaryColor();

  return new PasswordPrompt({
    validate,
    mask,
    render() {
      const symbol = getStateSymbol(this.state);
      const promptLine = `${chalk.gray(SYMBOLS.BAR)}\n${symbol}  ${message}\n`;

      const valueText = this.valueWithCursor;
      const maskedText = this.masked;

      switch (this.state) {
        case 'error':
          return `${promptLine.trim()}\n${chalk.yellow(SYMBOLS.BAR)}  ${maskedText}\n${chalk.yellow(SYMBOLS.BAR_END)}  ${chalk.yellow(this.error)}\n`;
        case 'submit':
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${chalk.dim(maskedText)}\n`;
        case 'cancel':
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${chalk.strikethrough(chalk.dim(maskedText || ''))}${maskedText ? `\n${chalk.gray(SYMBOLS.BAR)}` : ''}\n`;
        default:
          return `${promptLine}${primaryColor(SYMBOLS.BAR)}  ${valueText}\n${primaryColor(SYMBOLS.BAR_END)}\n`;
      }
    },
  }).prompt();
}

module.exports = password;

