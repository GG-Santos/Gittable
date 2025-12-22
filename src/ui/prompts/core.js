/**
 * Core prompt primitives
 * Base classes for all prompt types
 */

const readline = require('node:readline');
const process = require('node:process');
const tty = require('node:tty');
const chalk = require('chalk');
const sisteransi = require('sisteransi');
const { getTheme } = require('../../utils/ui');

// Cancel symbol
const CANCEL = Symbol('gittable:cancel');

/**
 * Check if a value is a cancel result
 */
function isCancel(value) {
  return value === CANCEL;
}

/**
 * Set raw mode for input
 */
function setRawMode(stream, mode) {
  if (stream.isTTY) {
    stream.setRawMode(mode);
  }
}

/**
 * Key mapping for vim-style navigation
 */
const KEY_MAP = new Map([
  ['k', 'up'],
  ['j', 'down'],
  ['h', 'left'],
  ['l', 'right'],
]);

/**
 * Base Prompt class
 */
class Prompt {
  constructor({ render, input = process.stdin, output = process.stdout, ...opts }, trackValue = true) {
    this.input = input;
    this.output = output;
    this.opts = opts;
    this._render = render.bind(this);
    this._track = trackValue;
    this._prevFrame = '';
    this._cursor = 0;
    this.state = 'initial';
    this.value = undefined;
    this.error = '';
    this.subscribers = new Map();
    this.rl = null;

    // Bind methods
    this.onKeypress = this.onKeypress.bind(this);
    this.close = this.close.bind(this);
    this.render = this.render.bind(this);
  }

  prompt() {
    const writeStream = new tty.WriteStream(0);
    writeStream._write = (chunk, encoding, callback) => {
      if (this._track) {
        this.value = this.rl.line.replace(/\t/g, '');
        this._cursor = this.rl.cursor;
        this.emit('value', this.value);
      }
      callback();
    };

    this.input.pipe(writeStream);
    this.rl = readline.createInterface({
      input: this.input,
      output: writeStream,
      tabSize: 2,
      prompt: '',
      escapeCodeTimeout: 50,
    });

    readline.emitKeypressEvents(this.input, this.rl);
    this.rl.prompt();

    if (this.opts.initialValue !== undefined && this._track) {
      this.rl.write(this.opts.initialValue);
    }

    this.input.on('keypress', this.onKeypress);
    setRawMode(this.input, true);
    this.output.on('resize', this.render);
    this.render();

    return new Promise((resolve, reject) => {
      this.once('submit', () => {
        this.output.write(sisteransi.cursor.show);
        this.output.off('resize', this.render);
        setRawMode(this.input, false);
        resolve(this.value);
      });

      this.once('cancel', () => {
        this.output.write(sisteransi.cursor.show);
        this.output.off('resize', this.render);
        setRawMode(this.input, false);
        resolve(CANCEL);
      });
    });
  }

  on(event, callback) {
    const handlers = this.subscribers.get(event) || [];
    handlers.push({ cb: callback });
    this.subscribers.set(event, handlers);
  }

  once(event, callback) {
    const handlers = this.subscribers.get(event) || [];
    handlers.push({ cb: callback, once: true });
    this.subscribers.set(event, handlers);
  }

  emit(event, ...args) {
    const handlers = this.subscribers.get(event) || [];
    const toRemove = [];

    for (const handler of handlers) {
      handler.cb(...args);
      if (handler.once) {
        toRemove.push(() => {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        });
      }
    }

    for (const remove of toRemove) {
      remove();
    }
  }

  unsubscribe() {
    this.subscribers.clear();
  }

  onKeypress(char, key) {
    if (this.state === 'error') {
      this.state = 'active';
    }

    if (key?.name && !this._track && KEY_MAP.has(key.name)) {
      this.emit('cursor', KEY_MAP.get(key.name));
    }

    if (key?.name && ['up', 'down', 'left', 'right', 'space', 'enter'].includes(key.name)) {
      this.emit('cursor', key.name);
    }

    if (char && (char.toLowerCase() === 'y' || char.toLowerCase() === 'n')) {
      this.emit('confirm', char.toLowerCase() === 'y');
    }

    if (char === '\t' && this.opts.placeholder) {
      if (!this.value) {
        this.rl.write(this.opts.placeholder);
        this.emit('value', this.opts.placeholder);
      }
    }

    if (char) {
      this.emit('key', char.toLowerCase());
    }

    if (key?.name === 'return') {
      if (this.opts.validate) {
        const error = this.opts.validate(this.value);
        if (error) {
          this.error = error;
          this.state = 'error';
          this.rl.write(this.value);
        }
      }

      if (this.state !== 'error') {
        this.state = 'submit';
      }
    }

    if (char === '\u0003') { // Ctrl+C
      this.state = 'cancel';
    }

    if (this.state === 'submit' || this.state === 'cancel') {
      this.emit('finalize');
    }

    this.render();

    if (this.state === 'submit' || this.state === 'cancel') {
      this.close();
    }
  }

  close() {
    this.input.unpipe();
    this.input.removeListener('keypress', this.onKeypress);
    this.output.write('\n');
    setRawMode(this.input, false);
    this.rl.close();
    this.emit(this.state, this.value);
    this.unsubscribe();
  }

  restoreCursor() {
    const lines = this._prevFrame.split('\n').length - 1;
    this.output.write(sisteransi.cursor.move(-999, lines * -1));
  }

  render() {
    const frame = this._render(this) || '';

    if (frame !== this._prevFrame) {
      if (this.state === 'initial') {
        this.output.write(sisteransi.cursor.hide);
      } else {
        this.restoreCursor();
        this.output.write(sisteransi.erase.down());
      }

      this.output.write(frame);
      if (this.state === 'initial') {
        this.state = 'active';
      }
      this._prevFrame = frame;
    }
  }
}

/**
 * Text Prompt
 */
class TextPrompt extends Prompt {
  constructor(opts) {
    super(opts, true);
    this.value = '';
    this.valueWithCursor = '';

    this.on('finalize', () => {
      this.valueWithCursor = this.value;
    });

    this.on('value', () => {
      if (this._cursor >= this.value.length) {
        this.valueWithCursor = `${this.value}${chalk.inverse(chalk.hidden('_'))}`;
      } else {
        const before = this.value.slice(0, this._cursor);
        const after = this.value.slice(this._cursor);
        this.valueWithCursor = `${before}${chalk.inverse(after[0])}${after.slice(1)}`;
      }
    });
  }

  get cursor() {
    return this._cursor;
  }
}

/**
 * Password Prompt
 */
class PasswordPrompt extends Prompt {
  constructor({ mask = '•', ...opts }) {
    super(opts, true);
    this._mask = mask;
    this.value = '';
    this.valueWithCursor = '';

    this.on('finalize', () => {
      this.valueWithCursor = this.masked;
    });

    this.on('value', () => {
      if (this._cursor >= this.value.length) {
        this.valueWithCursor = `${this.masked}${chalk.inverse(chalk.hidden('_'))}`;
      } else {
        const before = this.masked.slice(0, this._cursor);
        const after = this.masked.slice(this._cursor);
        this.valueWithCursor = `${before}${chalk.inverse(after[0])}${after.slice(1)}`;
      }
    });
  }

  get cursor() {
    return this._cursor;
  }

  get masked() {
    return this.value.replace(/./g, this._mask);
  }
}

/**
 * Confirm Prompt
 */
class ConfirmPrompt extends Prompt {
  get cursor() {
    return this.value ? 0 : 1;
  }

  get _value() {
    return this.cursor === 0;
  }

  constructor(opts) {
    super(opts, false);
    this.value = !!opts.initialValue;

    this.on('value', () => {
      this.value = this._value;
    });

    this.on('confirm', (value) => {
      this.output.write(sisteransi.cursor.move(0, -1));
      this.value = value;
      this.state = 'submit';
      this.close();
    });

    this.on('cursor', () => {
      this.value = !this.value;
    });
  }
}

/**
 * Select Prompt
 */
class SelectPrompt extends Prompt {
  constructor(opts) {
    super(opts, false);
    this.options = opts.options;
    this.cursor = Math.max(
      this.options.findIndex((opt) => opt.value === opts.initialValue),
      0
    );
    this.value = this.options[this.cursor]?.value;

    this.on('cursor', (direction) => {
      switch (direction) {
        case 'left':
        case 'up':
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          break;
        case 'down':
        case 'right':
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          break;
      }
      this.changeValue();
    });
  }

  get _value() {
    return this.options[this.cursor];
  }

  changeValue() {
    this.value = this._value.value;
  }
}

/**
 * Multi-Select Prompt
 */
class MultiSelectPrompt extends Prompt {
  constructor(opts) {
    super(opts, false);
    this.options = opts.options;
    this.cursor = Math.max(
      this.options.findIndex((opt) => opt.value === opts.cursorAt),
      0
    );
    this.value = [...(opts.initialValues || [])];

    this.on('key', (key) => {
      if (key === 'a') {
        this.toggleAll();
      }
    });

    this.on('cursor', (direction) => {
      switch (direction) {
        case 'left':
        case 'up':
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          break;
        case 'down':
        case 'right':
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          break;
        case 'space':
          this.toggleValue();
          break;
      }
    });
  }

  get _value() {
    return this.options[this.cursor].value;
  }

  toggleAll() {
    const allSelected = this.value.length === this.options.length;
    this.value = allSelected ? [] : this.options.map((opt) => opt.value);
  }

  toggleValue() {
    const isSelected = this.value.includes(this._value);
    this.value = isSelected
      ? this.value.filter((v) => v !== this._value)
      : [...this.value, this._value];
  }
}

/**
 * Group Multi-Select Prompt
 */
class GroupMultiSelectPrompt extends Prompt {
  constructor(opts) {
    super(opts, false);
    const { options } = opts;
    this.options = Object.entries(options).flatMap(([group, items]) => [
      { value: group, group: true, label: group },
      ...items.map((item) => ({ ...item, group })),
    ]);
    this.cursor = Math.max(
      this.options.findIndex((opt) => opt.value === opts.cursorAt),
      0
    );
    this.value = [...(opts.initialValues || [])];

    this.on('cursor', (direction) => {
      switch (direction) {
        case 'left':
        case 'up':
          this.cursor = this.cursor === 0 ? this.options.length - 1 : this.cursor - 1;
          break;
        case 'down':
        case 'right':
          this.cursor = this.cursor === this.options.length - 1 ? 0 : this.cursor + 1;
          break;
        case 'space':
          this.toggleValue();
          break;
      }
    });
  }

  getGroupItems(group) {
    return this.options.filter((opt) => opt.group === group);
  }

  isGroupSelected(group) {
    return this.getGroupItems(group).every((opt) => this.value.includes(opt.value));
  }

  toggleValue() {
    const option = this.options[this.cursor];
    if (option.group === true) {
      const group = option.value;
      const items = this.getGroupItems(group);
      const isSelected = this.isGroupSelected(group);

      if (isSelected) {
        this.value = this.value.filter((v) => !items.find((item) => item.value === v));
      } else {
        this.value = [...this.value, ...items.map((item) => item.value)];
      }
      this.value = Array.from(new Set(this.value));
    } else {
      const isSelected = this.value.includes(option.value);
      this.value = isSelected
        ? this.value.filter((v) => v !== option.value)
        : [...this.value, option.value];
    }
  }
}

/**
 * Select Key Prompt
 */
class SelectKeyPrompt extends Prompt {
  constructor(opts) {
    super(opts, false);
    this.options = opts.options;
    this.cursor = Math.max(
      this.options.findIndex((opt) => opt.value === opts.initialValue),
      0
    );

    this.on('key', (key) => {
      const option = this.options.find((opt) => {
        const firstChar = String(opt.value[0] || '').toLowerCase();
        return firstChar === key;
      });

      if (option) {
        this.value = option.value;
        this.state = 'submit';
        this.emit('submit');
      }
    });
  }
}

module.exports = {
  Prompt,
  TextPrompt,
  PasswordPrompt,
  ConfirmPrompt,
  SelectPrompt,
  MultiSelectPrompt,
  GroupMultiSelectPrompt,
  SelectKeyPrompt,
  isCancel,
  CANCEL,
};

