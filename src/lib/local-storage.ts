function canUseStorage(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function getStorageItem(key: string): string | null {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorageItem(key: string, value: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage write errors.
  }
}

export function removeStorageItem(key: string): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage remove errors.
  }
}

export function getStorageJson<T>(key: string, fallback: T): T {
  const value = getStorageItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function setStorageJson<T>(key: string, value: T): void {
  try {
    setStorageItem(key, JSON.stringify(value));
  } catch {
    // Ignore JSON serialization/storage errors.
  }
}
