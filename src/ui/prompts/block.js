/**
 * Block input during prompt rendering
 */

const readline = require('node:readline');
const process = require('node:process');
const tty = require('node:tty');
const sisteransi = require('../components/sisteransi');

const isWindows = process.platform.startsWith('win');

/**
 * Block input and hide cursor
 */
function block({ input = process.stdin, output = process.stdout, overwrite = true, hideCursor = true } = {}) {
  const rl = readline.createInterface({
    input,
    output,
    prompt: '',
    tabSize: 1,
  });

  readline.emitKeypressEvents(input, rl);

  if (input.isTTY) {
    input.setRawMode(true);
  }

  const onKeypress = (char, key) => {
    if (String(char) === '\u0003') {
      // Ctrl+C
      if (hideCursor) {
        output.write(sisteransi.cursor.show);
      }
      process.exit(0);
      return;
    }

    if (!overwrite) {
      return;
    }

    const moveUp = key?.name === 'return' ? 0 : -1;
    const moveDown = key?.name === 'return' ? -1 : 0;

    readline.moveCursor(output, moveUp, moveDown, () => {
      readline.clearLine(output, 1, () => {
        input.once('keypress', onKeypress);
      });
    });
  };

  if (hideCursor) {
    output.write(sisteransi.cursor.hide);
  }

  input.once('keypress', onKeypress);

  return () => {
    input.off('keypress', onKeypress);
    if (hideCursor) {
      output.write(sisteransi.cursor.show);
    }
    if (input.isTTY && !isWindows) {
      input.setRawMode(false);
    }
    rl.terminal = false;
    rl.close();
  };
}

module.exports = { block };

