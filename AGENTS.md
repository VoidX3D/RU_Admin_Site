# AGENTS — Admin Panel Guide

## Overview
RU Club Motherland Admin Panel — a **React 19 + TypeScript + Vite** SPA for managing all dynamic content on `ruclub.motherland.edu.np`. Every save writes directly to Supabase (no draft/publish workflow). Deployed at `ruclubadmin.vercel.app`.

## Tech Stack
- **Framework:** React 19 + TypeScript
- **Build:** Vite 7 + Tailwind CSS v4
- **Routing:** React Router DOM v7 (HashRouter in `App.tsx`)
- **Backend:** Supabase (Postgres + Storage), accessed via **service key** (`supabaseAdmin`) to bypass RLS
- **Animations:** Framer Motion
- **State:** React hooks + Zustand (`store.ts`)
- **Auth:** None — protected via `SettingsPage.tsx` session PIN

## Architecture
```
/src
├── App.tsx                  → HashRouter, all routes (lazy-loaded)
├── main.tsx                 → Entry, renders Root
├── index.css                → Tailwind v4 + dark theme + animations
├── store.ts                 → Zustand store (view, toasts, refreshTrigger, etc.)
├── types.ts                 → All TypeScript interfaces
├── utils/
│   ├── supabase.ts          → ALL DB operations (CRUD for every table)
│   ├── storage.ts           → Session + settings persistence (localStorage)
│   ├── helpers.ts           → countBy(), formatDate() + other utils
│   ├── backup.ts            → Import/export all settings (localStorage)
│   └── image.ts             → Image compression + processing (client-side)
├── components/
│   ├── Layout.tsx           → Root layout: sidebar nav + header + content
│   ├── Dashboard.tsx        → Home: stat cards + quick actions
│   ├── MissionsPage.tsx     → Full CRUD: form with all 7 child tables
│   ├── AnnouncementsPage.tsx→ Full CRUD: tags + gallery support
│   ├── MembersPage.tsx      → Full CRUD: image upload, types, tabs
│   ├── StatsEditorPage.tsx  → Global stats rows (value + label)
│   ├── PartnersEditorPage.tsx→ Partner logos (name + alt + image)
│   ├── ContactSubmissions.tsx→ Read-only viewer with detail panel
│   ├── SettingsPage.tsx     → Login PIN, theme, backup/restore
│   ├── HelpPage.tsx         → Keyboard shortcuts + usage guide
│   ├── Icons.tsx            → All SVG icon components (60+ icons)
│   ├── ErrorBoundary.tsx    → Global error boundary
│   └── form/
│       ├── index.ts         → Re-exports all form components
│       ├── Field.tsx        → Text input with label + error
│       ├── Textarea.tsx     → Textarea with label + error
│       ├── Select.tsx       → Dropdown select
│       ├── Toggle.tsx       → On/off switch
│       └── ImageUpload.tsx  → Drag & drop image picker
└── ...config files
```

## Routes
| Hash Route | Component | Data Source |
|---|---|---|
| `#/dashboard` | Dashboard | live DB counts |
| `#/missions` | MissionsPage | `saveMission()` + children |
| `#/announcements` | AnnouncementsPage | `saveAnnouncement()` + tags/gallery |
| `#/members` | MembersPage | `saveMembers()` delete-all-then-insert |
| `#/stats` | StatsEditorPage | `saveStats()` delete-all-then-insert |
| `#/partners` | PartnersEditorPage | `savePartners()` delete-all-then-insert |
| `#/contact` | ContactSubmissions | read-only + delete |
| `#/settings` | SettingsPage | localStorage |
| `#/help` | HelpPage | static |
| `*` | redirect → `#/dashboard` |

## DB Operations in `utils/supabase.ts`

### Pattern: delete-all-then-insert
Tables with no foreign key dependencies use this pattern (simpler, avoids update complexity):
- **stats** (`saveStats()`)
- **partners** (`savePartners()`)
- **members** (`saveMembers()`)

### Pattern: upsert + child-table replace
Tables with child dependencies use upsert for the parent and delete-all-then-insert for children:
- **missions** (`saveMission()`) — handles 7 child tables: stats, partners, images, goals, timeline, participants, budget
- **announcements** (`saveAnnouncement()`) — handles `announcement_tags` + `announcement_gallery`

### Pattern: read-only
- **contact_submissions** (`fetchContactSubmissions()`) — user-submitted messages, only read + delete

### Service Key
All DB operations use `supabaseAdmin` (service key) to bypass RLS. The anon key `supabase` client exists only for storage operations. Both use distinct `storageKey` values to avoid GoTrueClient conflicts.

### Image Upload
- `uploadBase64Image()` converts dataUrl → blob → File, uploads to `ruclub` bucket under `static/assets/`
- `storageUrl()` reconstructs the public URL from relative paths
- Used by: members (click avatar), partners (click preview), missions/announcements (ImageUpload component)

### Cascade Deletes
- `deleteMission()` manually deletes all 7 child tables before deleting the mission
- `deleteAnnouncement()` manually deletes tags + gallery before deleting the announcement

## Data Flow
1. Each page loads via `useEffect` + `refreshTrigger` from Zustand store
2. Dashboard refreshes every 30s; other pages refresh on navigation
3. Every save writes directly to Supabase — no draft, no publish step
4. Live badge in Layout header signals direct-DB mode
5. Toast notifications for success/error on every operation

## Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_KEY=your-service-role-key
```

## Key Conventions
- **No draft/publish workflow** — every save instant to DB
- **No GitHub PR workflow** — removed `github.ts`, `diff.ts`, `prTemplates.ts`
- **No autosave** — `autosave.ts`, `history.ts` removed
- **No localStorage drafts** — only session + settings persisted
- All pages have: loading skeleton, empty state, error handling
- Image previews use `storageUrl()` to resolve relative paths
- Stats/Partners editors have move-up/down reordering
- Row validation before save (required fields check)
- Dark mode via Tailwind `dark:` classes + theme toggle in settings

## Build
```bash
npm run build     # tsc -b && vite build → dist/
npm run dev       # vite dev server
```

## Checklist: Adding a New Table
1. Add type to `types.ts`
2. Add CRUD functions to `utils/supabase.ts` (use `supabaseAdmin`)
3. Create page component in `components/`
4. Add route in `App.tsx` (lazy import)
5. Add nav item in `Layout.tsx`
6. Add shortcut + help text in `HelpPage.tsx`
7. Add toast notifications for success/error

## Credits
Built by **Sincere Bhattarai** (@VoidX3D) for RU Club Motherland.
Managed by **Motherland Secondary School**, Pokhara, Nepal.
