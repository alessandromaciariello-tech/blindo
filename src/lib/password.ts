import { cryptoRng } from './sequence';

const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';

/** A password that satisfies Apple ID and common email-provider rules. */
export function generatePassword(length = 16): string {
  const all = LOWER + UPPER + DIGITS;
  const pick = (set: string) => set[cryptoRng(set.length)];
  const chars = [pick(LOWER), pick(UPPER), pick(DIGITS)];
  while (chars.length < length) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = cryptoRng(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
