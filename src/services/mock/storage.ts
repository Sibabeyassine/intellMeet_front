// Tiny localStorage helper with safe parse + namespace.
const NS = "intellmeet:v2:";

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(NS + key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
    } catch {
      /* quota, ignore */
    }
  },
  remove(key: string) {
    try { localStorage.removeItem(NS + key); } catch { /* ignore */ }
  },
};

export const delay = (ms = 280) => new Promise(r => setTimeout(r, ms));
export const uid = () => Math.random().toString(36).slice(2, 10);
export const nowISO = () => new Date().toISOString();
