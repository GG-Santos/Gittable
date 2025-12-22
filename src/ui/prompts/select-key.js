/**
 * Select key prompt implementation
 */

const chalk = require('chalk');
const { SelectKeyPrompt } = require('./core');
const { getStateSymbol, SYMBOLS, getPrimaryColor } = require('./theme');

/**
 * Format option for display
 */
function formatOption(option, state) {
  const label = option.label ?? String(option.value);
  const primaryColor = getPrimaryColor();

  switch (state) {
    case 'selected':
      return chalk.dim(label);
    case 'cancelled':
      return chalk.strikethrough(chalk.dim(label));
    case 'active':
      return `${chalk.bgCyan(chalk.gray(` ${option.value} `))} ${label} ${option.hint ? chalk.dim(`(${option.hint})`) : ''}`;
    default:
      return `${chalk.gray(chalk.bgWhite(chalk.inverse(` ${option.value} `)))} ${label} ${option.hint ? chalk.dim(`(${option.hint})`) : ''}`;
  }
}

/**
 * Select key prompt
 */
async function selectKey(options = {}) {
  const { message, options: opts, initialValue } = options;
  const primaryColor = getPrimaryColor();

  return new SelectKeyPrompt({
    options: opts,
    initialValue,
    render() {
      const symbol = getStateSymbol(this.state);
      const promptLine = `${chalk.gray(SYMBOLS.BAR)}\n${symbol}  ${message}\n`;

      switch (this.state) {
        case 'submit':
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${formatOption(this.options.find((opt) => opt.value === this.value), 'selected')}\n`;
        case 'cancel':
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${formatOption(this.options[0], 'cancelled')}\n${chalk.gray(SYMBOLS.BAR)}\n`;
        default:
          return `${promptLine}${primaryColor(SYMBOLS.BAR)}  ${this.options
            .map((opt, idx) => formatOption(opt, idx === this.cursor ? 'active' : 'inactive'))
            .join(`\n${primaryColor(SYMBOLS.BAR)}  `)}\n${primaryColor(SYMBOLS.BAR_END)}\n`;
      }
    },
  }).prompt();
}

module.exports = selectKey;

