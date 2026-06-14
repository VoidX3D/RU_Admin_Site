import { create } from 'zustand';
import type { MissionEntry, AnnouncementEntry, MembersData } from './types';

export type View = 'login' | 'dashboard' | 'missions' | 'announcements' | 'members' | 'stats' | 'partners' | 'contact' | 'settings' | 'help' | 'logs';

export interface Toast { id: string; message: string; type: 'success' | 'error' | 'warning' | 'info'; }

export interface AuthState {
  user: string | null;
  isAuthenticated: boolean;
  lastActivity: number;
  rememberMe: boolean;
  sessionExpiresAt: number | null;
}

export interface DraftEntry {
  id: string;
  type: 'mission' | 'announcement';
  data: Record<string, unknown>;
  savedAt: number;
}

interface LoginAttempt {
  count: number
  lastAttempt: number
  lockedUntil: number
}

let loginAttempts: LoginAttempt = { count: 0, lastAttempt: 0, lockedUntil: 0 }

const MAX_LOGIN_ATTEMPTS = Number(import.meta.env.VITE_MAX_LOGIN_ATTEMPTS) || 5
const LOCKOUT_MINUTES = Number(import.meta.env.VITE_LOCKOUT_MINUTES) || 15

export function checkLoginRateLimit(): number {
  const now = Date.now()
  if (now < loginAttempts.lockedUntil) return loginAttempts.lockedUntil - now
  if (now - loginAttempts.lastAttempt > 60000) loginAttempts = { count: 0, lastAttempt: now, lockedUntil: 0 }
  loginAttempts.count++
  loginAttempts.lastAttempt = now
  if (loginAttempts.count > MAX_LOGIN_ATTEMPTS) {
    loginAttempts.lockedUntil = now + LOCKOUT_MINUTES * 60 * 1000
    return LOCKOUT_MINUTES * 60 * 1000
  }
  return 0
}

export function resetLoginRateLimit() { loginAttempts = { count: 0, lastAttempt: 0, lockedUntil: 0 } }

interface AppState {
  view: View;
  auth: AuthState;
  missions: MissionEntry[];
  announcements: AnnouncementEntry[];
  members: MembersData | null;
  toasts: Toast[];
  theme: 'light' | 'dark';
  pendingAction: string | null;
  refreshTrigger: number;
  dbConnected: boolean | null;
  dbLastChecked: number | null;
  drafts: DraftEntry[];
  setView: (v: View) => void;
  setUser: (u: string | null) => void;
  login: (user: string, rememberMe: boolean, expiresAt?: number) => void;
  logout: () => void;
  updateActivity: () => void;
  setMissions: (m: MissionEntry[]) => void;
  setAnnouncements: (a: AnnouncementEntry[]) => void;
  setMembers: (m: MembersData) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  toggleTheme: () => void;
  setPendingAction: (a: string | null) => void;
  triggerRefresh: () => void;
  setDbConnected: (connected: boolean) => void;
  setDrafts: (drafts: DraftEntry[]) => void;
  saveDraft: (draft: DraftEntry) => void;
  removeDraft: (id: string) => void;
  clearDrafts: () => void;
}

function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

function getStoredTheme(): 'light' | 'dark' {
  const t = (() => { try { return localStorage.getItem('theme') } catch { return null } })()
  const theme = (t === 'light' || t === 'dark') ? t : 'dark'
  applyTheme(theme)
  return theme
}

function loadDrafts(): DraftEntry[] {
  try {
    const raw = localStorage.getItem('ru_admin_drafts')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export const useStore = create<AppState>((set) => ({
  view: 'login',
  auth: {
    user: null,
    isAuthenticated: false,
    lastActivity: Date.now(),
    rememberMe: false,
    sessionExpiresAt: null,
  },
  missions: [],
  announcements: [],
  members: null,
  toasts: [],
  theme: getStoredTheme(),
  pendingAction: null,
  refreshTrigger: 0,
  dbConnected: null,
  dbLastChecked: null,
  drafts: loadDrafts(),
  setView: (view) => set({ view }),
  setUser: (user) => set(s => ({ auth: { ...s.auth, user } })),
  login: (user, rememberMe, expiresAt) => set(s => ({
    view: 'dashboard',
    auth: {
      user,
      isAuthenticated: true,
      lastActivity: Date.now(),
      rememberMe,
      sessionExpiresAt: expiresAt ?? (rememberMe ? Date.now() + 7 * 24 * 60 * 60 * 1000 : Date.now() + 24 * 60 * 60 * 1000),
    },
  })),
  logout: () => set({
    view: 'login',
    auth: { user: null, isAuthenticated: false, lastActivity: 0, rememberMe: false, sessionExpiresAt: null },
    pendingAction: null,
  }),
  updateActivity: () => set(s => ({ auth: { ...s.auth, lastActivity: Date.now() } })),
  setMissions: (missions) => set({ missions }),
  setAnnouncements: (announcements) => set({ announcements }),
  setMembers: (members) => set({ members }),
  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2, 10);
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  toggleTheme: () => set(s => {
    const next = s.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('theme', next) } catch {}
    applyTheme(next)
    return { theme: next };
  }),
  setPendingAction: (a) => set({ pendingAction: a }),
  triggerRefresh: () => set(s => ({ refreshTrigger: s.refreshTrigger + 1 })),
  setDbConnected: (connected) => set(s => ({ dbConnected: connected, dbLastChecked: Date.now() })),
  setDrafts: (drafts) => {
    try { localStorage.setItem('ru_admin_drafts', JSON.stringify(drafts)) } catch {}
    set({ drafts })
  },
  saveDraft: (draft) => set(s => {
    const existing = s.drafts.findIndex(d => d.id === draft.id && d.type === draft.type)
    let updated: DraftEntry[]
    if (existing >= 0) {
      updated = [...s.drafts]
      updated[existing] = { ...draft, savedAt: Date.now() }
    } else {
      updated = [...s.drafts, { ...draft, savedAt: Date.now() }]
    }
    try { localStorage.setItem('ru_admin_drafts', JSON.stringify(updated)) } catch {}
    return { drafts: updated }
  }),
  removeDraft: (id) => set(s => {
    const updated = s.drafts.filter(d => d.id !== id)
    try { localStorage.setItem('ru_admin_drafts', JSON.stringify(updated)) } catch {}
    return { drafts: updated }
  }),
  clearDrafts: () => {
    try { localStorage.removeItem('ru_admin_drafts') } catch {}
    set({ drafts: [] })
  },
}));
