export interface MissionEntry {
  slug: string; id: string; title: string; description: string;
  tag?: string; date?: string; show?: boolean; imageCount?: number; featured?: string;
}
export interface MissionInfo {
  id: string; title: string; slug: string; tag?: string; date?: string;
  description: string; detail?: string; images: string[];
  stats?: Record<string,string>; partners?: string[]; show?: boolean;
}
export interface AnnouncementEntry {
  id: string; title: string; tag?: string; date: string; day?: string;
  summary: string; image?: string; active?: boolean; status?: string;
}
export interface AnnouncementFull {
  id: string; title: string; tag?: string; status?: string;
  tags?: string[]; date: string; day?: string; deadline?: string;
  time?: string; location?: string; issuedBy?: string;
  summary: string; description: string; importance?: string;
  instructions?: string; image?: string; active?: boolean; gallery?: string[];
}
export interface Member { name: string; class?: string; role: string; type?: string; }
export interface MembersData { teachers: Member[]; core: Member[]; general: Member[]; stats: { teachers: number; core: number; general: number; total: number; }; }
export interface Draft { type: 'mission' | 'announcement' | 'members'; id: string; title: string; updated: number; date?: string; imageCount?: number; image?: unknown; stats?: StatRow[]; partners?: string[]; show?: boolean; description?: string; detail?: string; tag?: string; [k: string]: unknown; }
export interface PendingImage { dataUrl: string; name: string; size?: number; remote?: boolean; }
export interface Settings {
  username: string; password: string; verifyCode: string;
  repoOwner: string; repoName: string; repoBranch: string;
}
export interface StatRow { key: string; value: string; }
