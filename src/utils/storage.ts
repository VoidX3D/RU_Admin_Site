import type { Settings } from '../types';

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000

function get<T>(key: string, def: T): T {
  try { const v = localStorage.getItem('ru_admin_' + key); return v ? JSON.parse(v) as T : def; }
  catch { return def; }
}
function set(key: string, val: unknown) {
  try { localStorage.setItem('ru_admin_' + key, JSON.stringify(val)); } catch {}
}
function remove(key: string) {
  try { localStorage.removeItem('ru_admin_' + key); } catch {}
}

export const Storage = {
  saveSession(user: string, rememberMe = false, expiresAt?: number) {
    set('session', { user, time: Date.now(), rememberMe, expiresAt: expiresAt || Date.now() + SESSION_EXPIRY_MS });
  },
  getSession: () => {
    const session = get<{ user: string; time: number; rememberMe?: boolean; expiresAt?: number } | null>('session', null);
    if (!session) return null;
    const expiry = session.expiresAt || session.time + SESSION_EXPIRY_MS
    if (Date.now() > expiry) {
      remove('session');
      remove('token');
      return null;
    }
    return session;
  },
  clearSession() { remove('session'); remove('token'); },

  saveToken(token: string) { set('token', token); },
  getToken(): string | null { return get<string | null>('token', null); },

  getSettings: (): Settings => {
    return { username: '', password: '', verifyCode: '' };
  },
};
