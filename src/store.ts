import { create } from 'zustand';
import type { MissionEntry, AnnouncementEntry, MembersData, Draft, PendingImage } from './types';
import { Storage } from './utils/storage';

export type View = 'login' | 'dashboard' | 'missions' | 'announcements' | 'members' | 'settings' | 'help' | 'history' | 'draftDiff';

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
  pendingImages: PendingImage[];
  pendingAnnImage: string | null;
  toasts: Toast[];
  prOpen: boolean;
  theme: 'light' | 'dark';
  pendingDraftId: string | null;
  pendingAction: string | null;
  refreshTrigger: number;
  setView: (v: View) => void;
  setUser: (u: string | null) => void;
  setMissions: (m: MissionEntry[]) => void;
  setAnnouncements: (a: AnnouncementEntry[]) => void;
  setMembers: (m: MembersData) => void;
  setPendingImages: (imgs: PendingImage[]) => void;
  addPendingImages: (imgs: PendingImage[]) => void;
  removePendingImage: (i: number) => void;
  setPendingAnnImage: (img: string | null) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  setPrOpen: (open: boolean) => void;
  toggleTheme: () => void;
  setPendingDraftId: (id: string | null) => void;
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
  pendingImages: [],
  pendingAnnImage: null,
  toasts: [],
  prOpen: false,
  theme: getStoredTheme(),
  pendingDraftId: null,
  pendingAction: null,
  refreshTrigger: 0,
  setView: (view) => set({ view }),
  setUser: (user) => set({ user }),
  setMissions: (missions) => set({ missions }),
  setAnnouncements: (announcements) => set({ announcements }),
  setMembers: (members) => set({ members }),
  setPendingImages: (pendingImages) => set({ pendingImages }),
  addPendingImages: (imgs) => set(s => ({ pendingImages: [...s.pendingImages, ...imgs] })),
  removePendingImage: (i) => set(s => ({ pendingImages: s.pendingImages.filter((_, idx) => idx !== i) })),
  setPendingAnnImage: (img) => set({ pendingAnnImage: img }),
  addToast: (message, type) => {
    const id = Math.random().toString(36).slice(2, 10);
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
  setPrOpen: (prOpen) => set({ prOpen }),
  toggleTheme: () => set(s => {
    const next = s.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('theme', next) } catch {}
    applyTheme(next)
    return { theme: next };
  }),
  setPendingDraftId: (id) => set({ pendingDraftId: id }),
  setPendingAction: (a) => set({ pendingAction: a }),
  triggerRefresh: () => set(s => ({ refreshTrigger: s.refreshTrigger + 1 })),
}));

export function getDrafts(): Draft[] { return Storage.listDrafts(); }
