import { useSyncExternalStore } from 'react';

// In-memory only: reloading the page locks the vault again.
export const UNLOCK_MS = 3 * 60_000;

let unlockedUntil = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function unlock() {
  unlockedUntil = Date.now() + UNLOCK_MS;
  emit();
  setTimeout(emit, UNLOCK_MS + 50);
}

export function lock() {
  unlockedUntil = 0;
  emit();
}

export const isUnlocked = () => Date.now() < unlockedUntil;

export function useUnlockedUntil(): number {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => (isUnlocked() ? unlockedUntil : 0),
  );
}
