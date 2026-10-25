import { describe, expect, it } from 'vitest';
import { buildSteps, generateCode, puzzle, replay } from './sequence';
import { progress } from './challenge';

const solve = (p: string) => {
  const [a, op, b] = p.split(' ');
  const x = Number(a), y = Number(b);
  return op === '÷' ? x / y : op === '−' ? x - y : x + y;
};

describe('buildSteps', () => {
  it('always ends with the original code and never fills the field early', () => {
    for (let n = 0; n < 2000; n++) {
      const code = generateCode();
      const steps = buildSteps(code);
      expect(replay(steps)).toBe(code);
      const full = steps.findIndex((s) => s.filled === code.length);
      expect(full).toBe(steps.length - 1);
      for (const s of steps) if (s.kind === 'digit') expect(solve(s.prompt)).toBe(s.digit);
    }
  });

  it('puzzles always resolve to the digit', () => {
    for (let d = 0; d < 10; d++) for (let n = 0; n < 100; n++) expect(solve(puzzle(d))).toBe(d);
  });
});

describe('progress', () => {
  const words = ['casa', 'mare', 'sole'];
  it('ignores spaces and case', () => {
    expect(progress(words, 'Casa ma')).toEqual({ words: 1, error: false, done: false });
    expect(progress(words, 'casamaresole')).toEqual({ words: 3, error: false, done: true });
  });
  it('flags a typo', () => {
    expect(progress(words, 'casx')).toMatchObject({ words: 0, error: true, done: false });
  });
});
