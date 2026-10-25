import { useSyncExternalStore } from 'react';
import { cryptoRng, type Step } from './sequence';

// Secrets are XOR-ed with a per-install salt so they never show up in plain
// text (e.g. in a Web Inspector glance). This is a speed bump, not encryption:
// the point of the app is friction, and the secret lives only on this device.

export interface Recovery {
  appleId: string;
  applePassword: string;
  emailPassword: string;
}

interface Stored {
  salt: string;
  code?: string;
  codeSetAt?: number;
  /** Setup in progress (see SetupProgress), so it survives iOS reloading the app. */
  setup?: string;
  recovery?: string;
  wordsRequired: number;
}

export interface Vault {
  hasCode: boolean;
  codeSetAt?: number;
  setupInProgress: boolean;
  hasRecovery: boolean;
  wordsRequired: number;
}

const KEY = 'blindo:v1';
export const DEFAULT_WORDS = 100;
export const MIN_WORDS = 20;
export const MAX_WORDS = 1000;

function randomSalt(): string {
  return Array.from({ length: 32 }, () => cryptoRng(256).toString(16).padStart(2, '0')).join('');
}

function xor(bytes: Uint8Array, salt: string): Uint8Array {
  const key = salt.match(/../g)!.map((h) => parseInt(h, 16));
  return bytes.map((b, i) => b ^ key[i % key.length]);
}

function hide(text: string, salt: string): string {
  const bytes = xor(new TextEncoder().encode(text), salt);
  return btoa(String.fromCharCode(...bytes));
}

function reveal(blob: string, salt: string): string {
  const bytes = Uint8Array.from(atob(blob), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(xor(bytes, salt));
}

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Stored;
  } catch {
    /* fall through to a fresh vault */
  }
  return { salt: randomSalt(), wordsRequired: DEFAULT_WORDS };
}

let stored = read();
let snapshot = toPublic(stored);
const listeners = new Set<() => void>();

function toPublic(s: Stored): Vault {
  return {
    hasCode: !!s.code,
    codeSetAt: s.codeSetAt,
    setupInProgress: !!s.setup,
    hasRecovery: !!s.recovery,
    wordsRequired: s.wordsRequired,
  };
}

function write(next: Stored) {
  stored = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  snapshot = toPublic(next);
  listeners.forEach((l) => l());
}

export function useVault(): Vault {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => snapshot,
  );
}

/** Asks the browser not to evict our storage (Safari otherwise may after 7 idle days). */
export function requestPersistence() {
  navigator.storage?.persist?.().catch(() => {});
}

export interface SetupProgress {
  code: string;
  /** Current code, shown when changing it (iOS asks for the old one first). */
  oldCode?: string;
  phase: 'old' | 'enter' | 'confirm';
  index: number;
  enter: Step[];
  confirm: Step[];
}

export function saveSetup(p: SetupProgress) {
  write({ ...stored, setup: hide(JSON.stringify(p), stored.salt) });
}

export function loadSetup(): SetupProgress | undefined {
  return stored.setup ? (JSON.parse(reveal(stored.setup, stored.salt)) as SetupProgress) : undefined;
}

/** iOS accepted the new code: it becomes the stored one. */
export function finishSetup() {
  const p = loadSetup();
  if (!p) return;
  const { setup: _, ...rest } = stored;
  write({ ...rest, code: hide(p.code, stored.salt), codeSetAt: Date.now() });
}

export function discardSetup() {
  const { setup: _, ...rest } = stored;
  write(rest);
}

// Only call these once the user has completed the word challenge.
export function getCode(): string | undefined {
  return stored.code ? reveal(stored.code, stored.salt) : undefined;
}

export function getRecovery(): Recovery | undefined {
  return stored.recovery ? (JSON.parse(reveal(stored.recovery, stored.salt)) as Recovery) : undefined;
}

export function setRecovery(r: Recovery) {
  write({ ...stored, recovery: hide(JSON.stringify(r), stored.salt) });
}

export function setWordsRequired(n: number) {
  write({ ...stored, wordsRequired: Math.min(MAX_WORDS, Math.max(MIN_WORDS, Math.round(n))) });
}

export function exportBackup(): string {
  return JSON.stringify({ app: 'blindo', version: 1, data: stored });
}

export function importBackup(json: string) {
  const parsed = JSON.parse(json);
  if (parsed?.app !== 'blindo' || typeof parsed.data?.salt !== 'string') throw new Error('File di backup non valido');
  write(parsed.data as Stored);
}

export function wipe() {
  localStorage.removeItem(KEY);
  stored = read();
  snapshot = toPublic(stored);
  listeners.forEach((l) => l());
}
