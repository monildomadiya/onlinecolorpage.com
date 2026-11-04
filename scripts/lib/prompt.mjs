/**
 * Terminal prompts that can be used more than once per run.
 *
 * `readline` is the obvious tool here, but it closes itself when a piped stdin
 * reaches EOF, and a second interface opened afterwards throws
 * ERR_USE_AFTER_CLOSE - so prompting twice (password, then repeat) breaks the
 * moment input is not a TTY. This reads stdin directly instead and keeps the
 * leftovers of each chunk, so it behaves the same whether a person is typing
 * or a test is piping lines in.
 *
 * `hidden: true` suppresses the echo, which is how a password reaches the
 * program without ever appearing on screen or in scrollback.
 */

const NEWLINE = /\r\n|\n|\r/;

/** Input already received but not yet consumed by a prompt. */
let pending = '';

const ETX = '\u0003'; // ctrl-c
const EOT = '\u0004'; // ctrl-d
const DEL = '\u007f';

function takeLine() {
  const index = pending.search(NEWLINE);
  if (index === -1) return null;
  const line = pending.slice(0, index);
  pending = pending.slice(index).replace(NEWLINE, '');
  return line;
}

export function ask(question, { hidden = false } = {}) {
  const stdin = process.stdin;
  const tty = Boolean(stdin.isTTY);

  stdin.setEncoding('utf8');
  process.stdout.write(question);

  // A previous chunk may already hold the answer to this prompt.
  if (!tty) {
    const ready = takeLine();
    if (ready !== null) {
      process.stdout.write('\n');
      return Promise.resolve(ready.trim());
    }
  }

  return new Promise((resolve) => {
    const finish = (line) => {
      stdin.removeListener('data', onData);
      stdin.removeListener('end', onEnd);
      if (tty) stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
      resolve(line.trim());
    };

    const onData = (chunk) => {
      if (!tty) {
        pending += chunk;
        const line = takeLine();
        if (line !== null) finish(line);
        return;
      }

      // Raw mode: one keypress at a time, and we draw the echo ourselves.
      for (const char of chunk) {
        if (char === ETX) {
          process.stdout.write('\n');
          process.exit(130);
        }
        if (char === '\r' || char === '\n' || char === EOT) {
          const line = pending;
          pending = '';
          finish(line);
          return;
        }
        if (char === DEL || char === '\b') {
          if (pending) {
            pending = pending.slice(0, -1);
            if (!hidden) process.stdout.write('\b \b');
          }
          continue;
        }
        pending += char;
        if (!hidden) process.stdout.write(char);
      }
    };

    const onEnd = () => {
      const line = pending;
      pending = '';
      finish(line);
    };

    if (tty) stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
    stdin.on('end', onEnd);
  });
}

/** Releases stdin so the process can exit once the prompts are done. */
export function endPrompts() {
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  process.stdin.pause();
}
