import { timingSafeEqual } from "crypto";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; first: number }>();

/** Constant-time comparison so response time does not reveal digits. */
export function passcodeMatches(supplied: string, actual: string | undefined): boolean {
  if (!actual || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Best-effort lockout (per server instance) against guessing the 6-digit code. */
export function isLockedOut(key: string): boolean {
  const entry = failures.get(key);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

export function recordFailure(key: string): void {
  const entry = failures.get(key);
  if (!entry || Date.now() - entry.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() });
  else entry.count += 1;
}

export function clearFailures(key: string): void {
  failures.delete(key);
}
