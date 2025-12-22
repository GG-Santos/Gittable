/**
 * Select prompt implementation
 */

const chalk = require('chalk');
const { SelectPrompt } = require('./core');
const { getStateSymbol, SYMBOLS, getPrimaryColor } = require('./theme');

/**
 * Format option for display
 */
function formatOption(option, state) {
  const label = option.label ?? String(option.value);
  const primaryColor = getPrimaryColor();

  switch (state) {
    case 'active':
      return `${primaryColor(SYMBOLS.RADIO_ACTIVE)} ${label} ${option.hint ? chalk.dim(`(${option.hint})`) : ''}`;
    case 'selected':
      return chalk.dim(label);
    case 'cancelled':
      return chalk.strikethrough(chalk.dim(label));
    default:
      return `${chalk.dim(SYMBOLS.RADIO_INACTIVE)} ${chalk.dim(label)}`;
  }
}

/**
 * Select prompt
 */
async function select(options = {}) {
  const { message, options: opts, initialValue, maxItems } = options;
  const primaryColor = getPrimaryColor();
  let startIndex = 0;

  return new SelectPrompt({
    options: opts,
    initialValue,
    render() {
      const symbol = getStateSymbol(this.state);
      const promptLine = `${chalk.gray(SYMBOLS.BAR)}\n${symbol}  ${message}\n`;

      switch (this.state) {
        case 'submit': {
          // Use └ (BAR_END) only for the last option, otherwise use ├ (CONNECT_LEFT)
          const isLastOption = this.cursor === this.options.length - 1;
          const symbol = isLastOption ? SYMBOLS.BAR_END : SYMBOLS.CONNECT_LEFT;
          return `${promptLine}${chalk.gray(symbol)}  ${formatOption(this.options[this.cursor], 'selected')}`;
        }
        case 'cancel':
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${formatOption(this.options[this.cursor], 'cancelled')}\n${chalk.gray(SYMBOLS.BAR)}\n`;
        default: {
          const maxVisible = maxItems === undefined ? Infinity : Math.max(maxItems, 5);
          const visibleCount = Math.min(maxVisible, this.options.length);

          // Calculate start index for scrolling
          if (this.cursor >= startIndex + visibleCount - 3) {
            startIndex = Math.max(Math.min(this.cursor - visibleCount + 3, this.options.length - visibleCount), 0);
          } else if (this.cursor < startIndex + 2) {
            startIndex = Math.max(this.cursor - 2, 0);
          }

          const hasMoreBefore = startIndex > 0;
          const hasMoreAfter = startIndex + visibleCount < this.options.length;

          const visibleOptions = this.options.slice(startIndex, startIndex + visibleCount);

          const optionsText = visibleOptions
            .map((opt, idx) => {
              const actualIndex = startIndex + idx;
              if ((idx === 0 && hasMoreBefore) || (idx === visibleOptions.length - 1 && hasMoreAfter)) {
                return chalk.dim('...');
              }
              return formatOption(opt, actualIndex === this.cursor ? 'active' : 'inactive');
            })
            .join(`\n${primaryColor(SYMBOLS.BAR)}  `);

          return `${promptLine}${primaryColor(SYMBOLS.BAR)}  ${optionsText}\n${primaryColor(SYMBOLS.BAR_END)}\n`;
        }
      }
    },
  }).prompt();
}

module.exports = select;

