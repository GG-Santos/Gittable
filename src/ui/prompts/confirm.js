/**
 * Confirm prompt implementation
 */

const chalk = require('chalk');
const { ConfirmPrompt } = require('./core');
const { getStateSymbol, SYMBOLS, getPrimaryColor } = require('./theme');

/**
 * Confirm prompt
 */
async function confirm(options = {}) {
  const { message, active = 'Yes', inactive = 'No', initialValue = true } = options;
  const primaryColor = getPrimaryColor();

  return new ConfirmPrompt({
    active,
    inactive,
    initialValue,
    render() {
      const symbol = getStateSymbol(this.state);
      const promptLine = `${chalk.gray(SYMBOLS.BAR)}\n${symbol}  ${message}\n`;

      const selectedText = this.value ? active : inactive;

      switch (this.state) {
        case 'submit':
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${chalk.dim(selectedText)}`;
        case 'cancel':
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${chalk.strikethrough(chalk.dim(selectedText))}\n${chalk.gray(SYMBOLS.BAR)}\n`;
        default:
          return `${promptLine}${primaryColor(SYMBOLS.BAR)}  ${
            this.value
              ? `${primaryColor(SYMBOLS.RADIO_ACTIVE)} ${active}`
              : `${chalk.dim(SYMBOLS.RADIO_INACTIVE)} ${chalk.dim(active)}`
          } ${chalk.dim('/')} ${
            this.value
              ? `${chalk.dim(SYMBOLS.RADIO_INACTIVE)} ${chalk.dim(inactive)}`
              : `${primaryColor(SYMBOLS.RADIO_ACTIVE)} ${inactive}`
          }\n${primaryColor(SYMBOLS.BAR_END)}\n`;
      }
    },
  }).prompt();
}

module.exports = confirm;

