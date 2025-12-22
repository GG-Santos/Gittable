/**
 * Multi-select prompt implementation
 */

const chalk = require('chalk');
const { MultiSelectPrompt } = require('./core');
const { getStateSymbol, SYMBOLS, getPrimaryColor } = require('./theme');

/**
 * Format option for display
 */
function formatOption(option, state) {
  const label = option.label ?? String(option.value);
  const primaryColor = getPrimaryColor();

  switch (state) {
    case 'active':
      return `${primaryColor(SYMBOLS.CHECKBOX_ACTIVE)} ${label} ${option.hint ? chalk.dim(`(${option.hint})`) : ''}`;
    case 'selected':
      return `${chalk.green(SYMBOLS.CHECKBOX_SELECTED)} ${chalk.dim(label)}`;
    case 'cancelled':
      return chalk.strikethrough(chalk.dim(label));
    case 'active-selected':
      return `${chalk.green(SYMBOLS.CHECKBOX_SELECTED)} ${label} ${option.hint ? chalk.dim(`(${option.hint})`) : ''}`;
    case 'submitted':
      return chalk.dim(label);
    default:
      return `${chalk.dim(SYMBOLS.CHECKBOX_INACTIVE)} ${chalk.dim(label)}`;
  }
}

/**
 * Multi-select prompt
 */
async function multiselect(options = {}) {
  const { message, options: opts, initialValues, required = true, cursorAt, maxItems } = options;
  const primaryColor = getPrimaryColor();
  let startIndex = 0;

  return new MultiSelectPrompt({
    options: opts,
    initialValues,
    required,
    cursorAt,
    validate(value) {
      if (this.required && value.length === 0) {
        return `Please select at least one option.\n${chalk.reset(chalk.dim(`Press ${chalk.gray(chalk.bgWhite(chalk.inverse(' space ')))} to select, ${chalk.gray(chalk.bgWhite(chalk.inverse(' enter ')))} to submit`))}`;
      }
      return undefined;
    },
    render() {
      const symbol = getStateSymbol(this.state);
      let promptLine = `${chalk.gray(SYMBOLS.BAR)}\n${symbol}  ${message}\n`;

      switch (this.state) {
        case 'submit':
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${this.options
            .filter((opt) => this.value.includes(opt.value))
            .map((opt) => formatOption(opt, 'submitted'))
            .join(chalk.dim(', ')) || chalk.dim('none')}\n`;
        case 'cancel': {
          const cancelled = this.options
            .filter((opt) => this.value.includes(opt.value))
            .map((opt) => formatOption(opt, 'cancelled'))
            .join(chalk.dim(', '));
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${cancelled.trim() ? `${cancelled}\n${chalk.gray(SYMBOLS.BAR)}` : ''}\n`;
        }
        case 'error': {
          const errorLines = this.error
            .split('\n')
            .map((line, idx) => (idx === 0 ? `${chalk.yellow(SYMBOLS.BAR_END)}  ${chalk.yellow(line)}` : `   ${line}`))
            .join('\n');
          
          // Filter out disabled options for scrolling calculation
          const selectableOptions = this.options.filter((opt) => !opt.disabled);
          const selectableCursor = selectableOptions.findIndex((opt) => opt === this.options[this.cursor]);
          
          const maxVisible = maxItems === undefined ? Infinity : Math.max(maxItems, 5);
          const visibleCount = Math.min(maxVisible, selectableOptions.length);
          
          // Calculate start index for scrolling (only for selectable options)
          if (selectableCursor >= 0) {
            if (selectableCursor >= startIndex + visibleCount - 3) {
              startIndex = Math.max(Math.min(selectableCursor - visibleCount + 3, selectableOptions.length - visibleCount), 0);
            } else if (selectableCursor < startIndex + 2) {
              startIndex = Math.max(selectableCursor - 2, 0);
            }
          }
          
          const hasMoreBefore = startIndex > 0;
          const hasMoreAfter = startIndex + visibleCount < selectableOptions.length;
          const visibleSelectableOptions = selectableOptions.slice(startIndex, startIndex + visibleCount);
          
          const optionsText = visibleSelectableOptions
            .map((opt, idx) => {
              const actualIndex = startIndex + idx;
              if ((idx === 0 && hasMoreBefore) || (idx === visibleSelectableOptions.length - 1 && hasMoreAfter)) {
                return chalk.dim('...');
              }
              const optIndex = this.options.findIndex((o) => o === opt);
              const isSelected = this.value.includes(opt.value);
              const isActive = optIndex === this.cursor;
              if (isActive && isSelected) {
                return formatOption(opt, 'active-selected');
              }
              if (isSelected) {
                return formatOption(opt, 'selected');
              }
              return formatOption(opt, isActive ? 'active' : 'inactive');
            })
            .join(`\n${chalk.yellow(SYMBOLS.BAR)}  `);
          
          return (
            promptLine +
            chalk.yellow(SYMBOLS.BAR) +
            '  ' +
            optionsText +
            '\n' +
            errorLines +
            '\n'
          );
        }
        default: {
          // Filter out disabled options for scrolling calculation
          const selectableOptions = this.options.filter((opt) => !opt.disabled);
          const selectableCursor = selectableOptions.findIndex((opt) => opt === this.options[this.cursor]);
          
          const maxVisible = maxItems === undefined ? Infinity : Math.max(maxItems, 5);
          const visibleCount = Math.min(maxVisible, selectableOptions.length);
          
          // Calculate start index for scrolling (only for selectable options)
          if (selectableCursor >= 0) {
            if (selectableCursor >= startIndex + visibleCount - 3) {
              startIndex = Math.max(Math.min(selectableCursor - visibleCount + 3, selectableOptions.length - visibleCount), 0);
            } else if (selectableCursor < startIndex + 2) {
              startIndex = Math.max(selectableCursor - 2, 0);
            }
          }
          
          const hasMoreBefore = startIndex > 0;
          const hasMoreAfter = startIndex + visibleCount < selectableOptions.length;
          const visibleSelectableOptions = selectableOptions.slice(startIndex, startIndex + visibleCount);
          
          const optionsText = visibleSelectableOptions
            .map((opt, idx) => {
              const actualIndex = startIndex + idx;
              if ((idx === 0 && hasMoreBefore) || (idx === visibleSelectableOptions.length - 1 && hasMoreAfter)) {
                return chalk.dim('...');
              }
              const optIndex = this.options.findIndex((o) => o === opt);
              const isSelected = this.value.includes(opt.value);
              const isActive = optIndex === this.cursor;
              if (isActive && isSelected) {
                return formatOption(opt, 'active-selected');
              }
              if (isSelected) {
                return formatOption(opt, 'selected');
              }
              return formatOption(opt, isActive ? 'active' : 'inactive');
            })
            .join(`\n${primaryColor(SYMBOLS.BAR)}  `);
          
          return `${promptLine}${primaryColor(SYMBOLS.BAR)}  ${optionsText}\n${primaryColor(SYMBOLS.BAR_END)}\n`;
        }
      }
    },
  }).prompt();
}

module.exports = multiselect;

