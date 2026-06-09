import { create } from 'zustand';
import type { MissionEntry, AnnouncementEntry, MembersData } from './types';

export type View = 'login' | 'dashboard' | 'missions' | 'announcements' | 'members' | 'stats' | 'partners' | 'contact' | 'settings' | 'help';

export interface Toast { id: string; message: string; type: 'success' | 'error' | 'warning' | 'info'; }

interface LoginAttempt {
  count: number
  lastAttempt: number
}

let loginAttempts: LoginAttempt = { count: 0, lastAttempt: 0 }

export function checkLoginRateLimit(): number {
  const now = Date.now()
  if (now - loginAttempts.lastAttempt > 60000) loginAttempts = { count: 0, lastAttempt: now }
  loginAttempts.count++
  loginAttempts.lastAttempt = now
  if (loginAttempts.count > 5) return Math.min((loginAttempts.count - 5) * 2000, 30000)
  return 0
}

export function resetLoginRateLimit() { loginAttempts = { count: 0, lastAttempt: 0 } }

interface AppState {
  view: View;
  user: string | null;
  missions: MissionEntry[];
  announcements: AnnouncementEntry[];
  members: MembersData | null;
  toasts: Toast[];
  theme: 'light' | 'dark';
  pendingAction: string | null;
  refreshTrigger: number;
  setView: (v: View) => void;
  setUser: (u: string | null) => void;
  setMissions: (m: MissionEntry[]) => void;
  setAnnouncements: (a: AnnouncementEntry[]) => void;
  setMembers: (m: MembersData) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  toggleTheme: () => void;
  setPendingAction: (a: string | null) => void;
  triggerRefresh: () => void;
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

export const useStore = create<AppState>((set) => ({
  view: 'login',
  user: null,
  missions: [],
  announcements: [],
  members: null,
  toasts: [],
  theme: getStoredTheme(),
  pendingAction: null,
  refreshTrigger: 0,
  setView: (view) => set({ view }),
  setUser: (user) => set({ user }),
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
}));
