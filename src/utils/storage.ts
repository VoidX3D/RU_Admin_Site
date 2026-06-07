import type { Settings, Draft } from '../types';
import { getEnvConfig, isProductionEnv } from './env';

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000
const MAX_DRAFTS = 50
const MAX_DRAFT_SIZE = 1024 * 1024

function isStorageQuotaAvailable(): boolean {
  try {
    const testKey = 'ru_admin_quota_test_'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function get<T>(key: string, def: T): T {
  try { const v = localStorage.getItem('ru_admin_' + key); return v ? JSON.parse(v) as T : def; }
  catch { return def; }
}
function set(key: string, val: unknown) {
  try {
    if (!isStorageQuotaAvailable()) {
      console.warn('localStorage quota exceeded — evicting old drafts')
      evictOldDrafts()
    }
    localStorage.setItem('ru_admin_' + key, JSON.stringify(val));
  } catch {
    const size = JSON.stringify(val).length
    if (size > MAX_DRAFT_SIZE) {
      console.warn('Value too large for localStorage (>1MB), skipping')
    }
  }
}
function remove(key: string) {
  try { localStorage.removeItem('ru_admin_' + key); } catch {}
}

function evictOldDrafts() {
  const drafts = get<Draft[]>('drafts', [])
  if (drafts.length > MAX_DRAFTS) {
    const sorted = drafts.sort((a, b) => (b.updated || 0) - (a.updated || 0))
    const kept = sorted.slice(0, MAX_DRAFTS)
    const evicted = sorted.slice(MAX_DRAFTS)
    set('drafts', kept)
    for (const d of evicted) {
      remove('draft_' + d.type + '_' + d.id)
    }
  }
}

export const Storage = {
  saveDraft(type: string, id: string, data: Record<string, unknown>) {
    const drafts = get<Draft[]>('drafts', []);
    const idx = drafts.findIndex(d => d.type === type && d.id === id);
    const entry: Draft = { type: type as Draft['type'], id, title: (data.title as string) || id, updated: Date.now(), ...data };
    if (idx >= 0) drafts[idx] = { ...drafts[idx], ...entry };
    else drafts.push(entry);
    set('drafts', drafts);
    set('draft_' + type + '_' + id, data);
  },
  getDraft(type: string, id: string) { return get<Record<string, unknown> | null>('draft_' + type + '_' + id, null); },
  listDrafts: () => {
    const drafts = get<Draft[]>('drafts', []).filter(d => d.id)
    if (drafts.length > MAX_DRAFTS) {
      const sorted = drafts.sort((a, b) => (b.updated || 0) - (a.updated || 0))
      const kept = sorted.slice(0, MAX_DRAFTS)
      const evicted = sorted.slice(MAX_DRAFTS)
      set('drafts', kept)
      for (const d of evicted) {
        remove('draft_' + d.type + '_' + d.id)
      }
      return kept
    }
    return drafts
  },
  deleteDraft(type: string, id: string) {
    const drafts = get<Draft[]>('drafts', []).filter(d => !(d.type === type && d.id === id));
    set('drafts', drafts);
    remove('draft_' + type + '_' + id);
  },

  saveSession(user: string) {
    set('session', { user, time: Date.now() });
  },
  getSession: () => {
    const session = get<{ user: string; time: number } | null>('session', null);
    if (!session) return null;
    if (Date.now() - session.time > SESSION_EXPIRY_MS) {
      remove('session');
      return null;
    }
    return session;
  },
  clearSession() { remove('session'); },

  saveSettings(s: Settings) {
    if (isProductionEnv()) return;
    const env = getEnvConfig();
    set('settings', {
      repoOwner: s.repoOwner || env.GITHUB_OWNER,
      repoName: s.repoName || env.GITHUB_REPO,
      repoBranch: s.repoBranch || env.GITHUB_BRANCH,
    });
  },

  getSettings: (): Settings => {
    const env = getEnvConfig();
    const auth = {
      username: env.ADMIN_USERNAME || '',
      password: env.ADMIN_PASSWORD || '',
      verifyCode: env.PR_VERIFY_CODE || '',
    };
    if (isProductionEnv()) {
      return { ...auth, repoOwner: env.GITHUB_OWNER, repoName: env.GITHUB_REPO, repoBranch: env.GITHUB_BRANCH };
    }
    const saved = get<Partial<Settings> | null>('settings', null);
    return {
      ...auth,
      repoOwner: saved?.repoOwner || env.GITHUB_OWNER,
      repoName: saved?.repoName || env.GITHUB_REPO,
      repoBranch: saved?.repoBranch || env.GITHUB_BRANCH,
    };
  },

  saveToken(token: string) {
    try { sessionStorage.setItem('ru_admin_github_token', token) } catch {}
  },
  getToken: () => {
    try { return sessionStorage.getItem('ru_admin_github_token') || '' } catch { return '' }
  },
  clearToken() {
    try { sessionStorage.removeItem('ru_admin_github_token') } catch {}
  },
};
