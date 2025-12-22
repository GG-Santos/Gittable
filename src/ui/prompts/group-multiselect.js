/**
 * Group multi-select prompt implementation
 */

const chalk = require('chalk');
const { GroupMultiSelectPrompt } = require('./core');
const { getStateSymbol, SYMBOLS, getPrimaryColor } = require('./theme');

/**
 * Format option for display
 */
function formatOption(option, state, options = []) {
  const label = option.label ?? String(option.value);
  const primaryColor = getPrimaryColor();
  const isGroup = typeof option.group === 'string';
  const nextOption = options[options.indexOf(option) + 1];
  const isGroupEnd = isGroup && nextOption?.group === true;
  const prefix = isGroup ? `${isGroupEnd ? SYMBOLS.BAR_END : SYMBOLS.BAR} ` : '';

  switch (state) {
    case 'active':
      return `${chalk.dim(prefix)}${primaryColor(SYMBOLS.CHECKBOX_ACTIVE)} ${label} ${option.hint ? chalk.dim(`(${option.hint})`) : ''}`;
    case 'group-active':
      return `${prefix}${primaryColor(SYMBOLS.CHECKBOX_ACTIVE)} ${chalk.dim(label)}`;
    case 'group-active-selected':
      return `${prefix}${chalk.green(SYMBOLS.CHECKBOX_SELECTED)} ${chalk.dim(label)}`;
    case 'selected':
      return `${chalk.dim(prefix)}${chalk.green(SYMBOLS.CHECKBOX_SELECTED)} ${chalk.dim(label)}`;
    case 'cancelled':
      return chalk.strikethrough(chalk.dim(label));
    case 'active-selected':
      return `${chalk.dim(prefix)}${chalk.green(SYMBOLS.CHECKBOX_SELECTED)} ${label} ${option.hint ? chalk.dim(`(${option.hint})`) : ''}`;
    case 'submitted':
      return chalk.dim(label);
    default:
      return `${chalk.dim(prefix)}${chalk.dim(SYMBOLS.CHECKBOX_INACTIVE)} ${chalk.dim(label)}`;
  }
}

/**
 * Group multi-select prompt
 */
async function groupMultiselect(options = {}) {
  const { message, options: opts, initialValues, required = true, cursorAt } = options;
  const primaryColor = getPrimaryColor();

  return new GroupMultiSelectPrompt({
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
            .map((opt) => formatOption(opt, 'submitted', this.options))
            .join(chalk.dim(', '))}\n`;
        case 'cancel': {
          const cancelled = this.options
            .filter((opt) => this.value.includes(opt.value))
            .map((opt) => formatOption(opt, 'cancelled', this.options))
            .join(chalk.dim(', '));
          return `${promptLine}${chalk.gray(SYMBOLS.BAR)}  ${cancelled.trim() ? `${cancelled}\n${chalk.gray(SYMBOLS.BAR)}` : ''}\n`;
        }
        case 'error': {
          const errorLines = this.error
            .split('\n')
            .map((line, idx) => (idx === 0 ? `${chalk.yellow(SYMBOLS.BAR_END)}  ${chalk.yellow(line)}` : `   ${line}`))
            .join('\n');
          return (
            promptLine +
            chalk.yellow(SYMBOLS.BAR) +
            '  ' +
            this.options
              .map((opt, idx, all) => {
                const isSelected = this.value.includes(opt.value) || (opt.group === true && this.isGroupSelected(`${opt.value}`));
                const isActive = idx === this.cursor;
                const isGroupHeader = typeof opt.group === 'string' && this.options[this.cursor].value === opt.group && !isActive;

                if (isGroupHeader) {
                  return formatOption(opt, isSelected ? 'group-active-selected' : 'group-active', all);
                }
                if (isActive && isSelected) {
                  return formatOption(opt, 'active-selected', all);
                }
                if (isSelected) {
                  return formatOption(opt, 'selected', all);
                }
                return formatOption(opt, isActive ? 'active' : 'inactive', all);
              })
              .join(`\n${chalk.yellow(SYMBOLS.BAR)}  `) +
            '\n' +
            errorLines +
            '\n'
          );
        }
        default:
          return `${promptLine}${primaryColor(SYMBOLS.BAR)}  ${this.options
            .map((opt, idx, all) => {
              const isSelected = this.value.includes(opt.value) || (opt.group === true && this.isGroupSelected(`${opt.value}`));
              const isActive = idx === this.cursor;
              const isGroupHeader = typeof opt.group === 'string' && this.options[this.cursor].value === opt.group && !isActive;

              if (isGroupHeader) {
                return formatOption(opt, isSelected ? 'group-active-selected' : 'group-active', all);
              }
              if (isActive && isSelected) {
                return formatOption(opt, 'active-selected', all);
              }
              if (isSelected) {
                return formatOption(opt, 'selected', all);
              }
              return formatOption(opt, isActive ? 'active' : 'inactive', all);
            })
            .join(`\n${primaryColor(SYMBOLS.BAR)}  `)}\n${primaryColor(SYMBOLS.BAR_END)}\n`;
      }
    },
  }).prompt();
}

module.exports = groupMultiselect;

