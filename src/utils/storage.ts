import type { Settings, Draft } from '../types';
import { getEnvConfig, isProductionEnv } from './env';

function get<T>(key: string, def: T): T {
  try { const v = localStorage.getItem('ru_admin_' + key); return v ? JSON.parse(v) : def; }
  catch { return def; }
}
function set(key: string, val: unknown) {
  try { localStorage.setItem('ru_admin_' + key, JSON.stringify(val)); } catch {}
}
function remove(key: string) {
  try { localStorage.removeItem('ru_admin_' + key); } catch {}
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
  listDrafts: () => get<Draft[]>('drafts', []).filter(d => d.id),
  deleteDraft(type: string, id: string) {
    const drafts = get<Draft[]>('drafts', []).filter(d => !(d.type === type && d.id === id));
    set('drafts', drafts);
    remove('draft_' + type + '_' + id);
  },
  saveSession(user: string) { set('session', { user, time: Date.now() }); },
  getSession: () => get<{ user: string; time: number } | null>('session', null),
  clearSession() { remove('session'); },

  // Auth always comes from env. Only repo settings are persisted locally.
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

    // Auth fields ALWAYS from env — never from localStorage
    const auth = {
      username: env.ADMIN_USERNAME || '',
      password: env.ADMIN_PASSWORD || '',
      verifyCode: env.PR_VERIFY_CODE || '',
    };

    if (isProductionEnv()) {
      return { ...auth, repoOwner: env.GITHUB_OWNER, repoName: env.GITHUB_REPO, repoBranch: env.GITHUB_BRANCH };
    }

    // In dev mode, repo settings can be overridden via localStorage
    const saved = get<Partial<Settings> | null>('settings', null);
    return {
      ...auth,
      repoOwner: saved?.repoOwner || env.GITHUB_OWNER,
      repoName: saved?.repoName || env.GITHUB_REPO,
      repoBranch: saved?.repoBranch || env.GITHUB_BRANCH,
    };
  },

  saveToken(token: string) { set('github_token', token); },
  getToken: () => get<string>('github_token', ''),
};
