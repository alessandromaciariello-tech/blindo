// Turns a passcode into a confusing list of keypad instructions: each digit is
// hidden behind a small arithmetic puzzle, and decoy digits are typed and then
// deleted so the final code is hard to reconstruct from memory.

export type Step =
  | { kind: 'digit'; digit: number; prompt: string; filled: number }
  | { kind: 'delete'; filled: number };

export type Rng = (maxExclusive: number) => number;

export const cryptoRng: Rng = (max) => {
  const buf = new Uint32Array(1);
  // Rejection sampling keeps the distribution uniform.
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
};

export function generateCode(length = 4, rng: Rng = cryptoRng): string {
  return Array.from({ length }, () => rng(10)).join('');
}

export function puzzle(d: number, rng: Rng = cryptoRng): string {
  const b = 1 + rng(9);
  switch (rng(3)) {
    case 0:
      return `${d * b} ÷ ${b}`;
    case 1:
      return `${d + b} − ${b}`;
    default: {
      // a + b where both are non-negative
      const a = rng(d + 1);
      return `${a} + ${d - a}`;
    }
  }
}

export function buildSteps(code: string, rng: Rng = cryptoRng): Step[] {
  const len = code.length;
  const steps: Step[] = [];
  const buffer: number[] = [];

  const type = (digit: number) => {
    buffer.push(digit);
    steps.push({ kind: 'digit', digit, prompt: puzzle(digit, rng), filled: buffer.length });
  };
  const del = () => {
    buffer.pop();
    steps.push({ kind: 'delete', filled: buffer.length });
  };

  for (let i = 0; i < len; i++) {
    // iOS submits as soon as the last digit is typed, so noise must never fill
    // the whole field: only add noise while at least one slot stays empty.
    const bursts = i < len - 1 ? rng(3) : 0;
    for (let k = 0; k < bursts; k++) {
      const room = len - 1 - buffer.length;
      if (buffer.length > 0 && rng(3) === 0) {
        // Rewind: delete the last real digit and retype it.
        const last = buffer[buffer.length - 1];
        del();
        type(last);
      } else if (room > 0) {
        const n = 1 + rng(Math.min(room, 2));
        for (let j = 0; j < n; j++) type(rng(10));
        for (let j = 0; j < n; j++) del();
      }
    }
    type(Number(code[i]));
  }
  return steps;
}

/** Applies the steps to an empty keypad buffer and returns what ends up typed. */
export function replay(steps: Step[]): string {
  const out: number[] = [];
  for (const s of steps) s.kind === 'digit' ? out.push(s.digit) : out.pop();
  return out.join('');
}
