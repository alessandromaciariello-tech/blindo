import { cryptoRng, type Rng } from './sequence';
import { WORDS } from './words';

export function randomWords(count: number, rng: Rng = cryptoRng): string[] {
  return Array.from({ length: count }, () => WORDS[rng(WORDS.length)]);
}

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '');

export interface Progress {
  /** Number of words typed correctly so far. */
  words: number;
  /** True when the input contains a character that doesn't match. */
  error: boolean;
  done: boolean;
}

export function progress(words: string[], input: string): Progress {
  const target = normalize(words.join(''));
  const typed = normalize(input);
  let i = 0;
  while (i < typed.length && i < target.length && typed[i] === target[i]) i++;

  let count = 0;
  let acc = 0;
  for (const w of words) {
    if (acc + w.length > i) break;
    acc += w.length;
    count++;
  }
  return { words: count, error: i < typed.length, done: i === target.length && typed.length === target.length };
}
