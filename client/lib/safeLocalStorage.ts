export function safeGetJSON<T = any>(key: string, defaultValue: T | null = null): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    // Failed to parse - remove corrupted data
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`safeGetJSON: failed to parse localStorage key ${key}`, err);
    }
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
    return defaultValue;
  }
}

export function safeSetJSON(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Failed to set - likely quota exceeded
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`safeSetJSON: failed to set localStorage key ${key}`, err);
    }
  }
}
