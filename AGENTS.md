# AGENTS — Admin Panel Guide

## Overview
RU Club Motherland Admin Panel — a **React 18.3 + TypeScript + Vite 7** SPA for managing all dynamic content. Every save writes directly to Supabase. Deployed at `ruclubadmin.vercel.app`. Authentication via JWT (ES256/HS256 dual-algorithm) + environment variable credentials.

## Tech Stack
- **Framework:** React 18.3 + TypeScript
- **Build:** Vite 7 + Tailwind CSS v3
- **Routing:** Zustand-based view switching (no React Router)
- **Backend:** Supabase (Postgres + Storage), accessed via **service key** (`supabaseAdmin`) to bypass RLS
- **Animations:** Framer Motion
- **State:** Zustand (`store.ts`)
- **Auth:** JWT-based login via `/api/admin` endpoint — signs with ES256, falls back to HS256 verification

## Architecture
```
/src
├── App.tsx                  → Root: lazy-loaded pages, auth gate, connection check, keyboard shortcuts (guarded)
├── main.tsx                 → Entry, renders App
├── App.css                  → Tailwind + KaTeX + scrollbar styles
├── store.ts                 → Zustand store (auth, view, toasts, drafts, DB status)
├── types.ts                 → All TypeScript interfaces
├── utils/
│   ├── supabase.ts          → ALL DB operations via /api/admin endpoint (token guard, early 401 rejection)
│   ├── storage.ts           → Session + token persistence (localStorage)
│   ├── helpers.ts           → formatDate(), debounce(), cn(), etc.
│   ├── validation.ts        → Field/form validation, email/slug/date rules
│   ├── drafts.ts            → localStorage draft save/load system
│   ├── image.ts             → Image compression + upload retry logic
│   ├── markdown.ts          → Markdown rendering (marked + KaTeX + DOMPurify)
│   ├── analytics.ts         → GA4 dual-tag initialization
│   ├── backup.ts            → Import/export all settings
│   └── env.ts               → Environment config reader
├── hooks/
│   └── useKeyboardShortcuts.ts → Global keyboard shortcut hook
├── components/
│   ├── Login.tsx            → JWT login with success overlay animation, Remember Me, master key, rate limiting
│   ├── Layout.tsx           → Sidebar nav + header + ConnectionStatus + logout + refresh button
│   ├── Dashboard.tsx        → Stat cards + quick actions + silent background auto-refresh (2min)
│   ├── MissionsPage.tsx     → Full CRUD: 7 child tables + drafts + PageErrorBoundary
│   ├── AnnouncementsPage.tsx→ Tags + images + drafts + PageErrorBoundary
│   ├── MembersPage.tsx      → 3 tabs, image upload, CSV/JSON export, validation
│   ├── StatsEditorPage.tsx  → Global stats rows (value + label)
│   ├── PartnersEditorPage.tsx→ Partner logos (name + alt + image)
│   ├── ContactSubmissions.tsx→ Paginated viewer (50/page) + email validation
│   ├── SettingsPage.tsx     → DB status, backup/restore, data migration
│   ├── HelpPage.tsx         → Keyboard shortcuts + usage guide
│   ├── Icons.tsx            → 60+ SVG icon components
│   ├── ErrorBoundary.tsx    → Global error boundary with chunk error detection
│   ├── PageErrorBoundary.tsx→ Page-level error boundary with Reset button
│   ├── ConnectionStatus.tsx → Live DB connection indicator (stale-closure-safe via ref)
│   ├── ConfirmModal.tsx     → Delete confirmation dialog
│   ├── ContextMenu.tsx      → Right-click context menu
│   ├── ShortcutsHelp.tsx    → Keyboard shortcuts help modal
│   ├── DraftIndicator.tsx   → Draft saved indicator with age
│   ├── Modal.tsx            → Reusable modal dialog
│   ├── Toast.tsx            → Toast notification system
│   ├── AnimatedBackground.tsx→ Canvas particle background
│   └── form/
│       ├── index.ts         → Re-exports all form components
│       ├── Field.tsx        → Text input with label + error + maxLength
│       ├── Textarea.tsx     → Textarea with label + error
│       ├── Select.tsx       → Dropdown select
│       ├── Toggle.tsx       → On/off switch
│       ├── ImageUpload.tsx  → Drag & drop with progress bar + retry
│       ├── RichTextEditor.tsx→ Full markdown editor with toolbar + preview
│       ├── StatsEditor.tsx  → Key-value pair editor
│       └── ... (PartnersEditor, GoalsEditor, TimelineEditor, ParticipantsEditor, BudgetEditor)
├── styles/
│   └── md-content.css       → Markdown rendering styles
└── api/
    └── admin.ts             → Vercel serverless handler (all DB ops, auth, image upload, ES256/HS256 JWT)
```

## Pages & View Switching
| View | Component | Data | Notes |
|---|---|---|---|
| `login` | Login | env vars | JWT auth, success overlay, rate-limited, master key support |
| `dashboard` | Dashboard | DB stats | Stat cards + quick actions + background auto-refresh |
| `missions` | MissionsPage | 7 sub-tables | Full CRUD + drafts + PageErrorBoundary |
| `announcements` | AnnouncementsPage | Tags + image | Full CRUD + drafts + PageErrorBoundary |
| `members` | MembersPage | 3 groups | CSV/JSON export + validation |
| `stats` | StatsEditorPage | Rows | Delete-all-then-insert |
| `partners` | PartnersEditorPage | Rows + images | Delete-all-then-insert |
| `contact` | ContactSubmissions | Read-only | Paginated (50/page) + email validation |
| `settings` | SettingsPage | localStorage | Backup/restore, DB status |
| `help` | HelpPage | Static | Keyboard shortcuts guide |

## Key Features
- **Authentication:** JWT-based login with ES256 signing (HS256 fallback), "Remember Me" (7-day session), master key bypass, rate limiting (5 attempts → 15-min lockout), inactivity timeout (30 min)
- **Login Experience:** 1.5s success overlay animation with checkmark → redirect to dashboard → welcome toast + auto data refresh
- **401 Prevention:** `api()` rejects early (no network call) when no token exists; DB check only runs when authenticated; ConnectionStatus interval guarded by `auth.isAuthenticated`
- **Connection Status:** Live DB indicator in header, auto-checks every 30s (via ref to avoid stale closures), color-coded (green/red/yellow), click to refresh
- **Validation:** Required fields, email format, slug format (lowercase-hyphens), date format, image file types, character limits, duplicate slug detection
- **Image Upload:** Drag-and-drop, compression (max 1920px), retry on failure (3 attempts with exponential backoff), progress bar, preview before upload
- **Error Handling:** Global ErrorBoundary with chunk error detection + cache reset, PageErrorBoundary per page with Reset button
- **Drafts:** Auto-save every 30s, restore on new/edit, clear on save, age indicator, localStorage quota handling
- **Keyboard Shortcuts:** Ctrl+1/2 new mission/announcement, Ctrl+D/M/U navigation, Ctrl+Shift+A/C/S for announcements/contact/settings, Ctrl+? for help (guarded behind auth)
- **Performance:** Contact submissions paginated (50/page), memoized filtered lists, debounced search, Dashboard silent auto-refresh every 2min
- **Dark Mode:** Persisted in localStorage, theme toggle in sidebar, Tailwind `dark:` classes

## DB Operations in `api/admin.ts`

### Pattern: delete-all-then-insert
Tables with no foreign key dependencies:
- **stats** - `stats:save`
- **partners** - `partners:save`
- **members** - `members:save`

### Pattern: upsert + child-table replace
Tables with child dependencies:
- **missions** (`missions:save`) — 7 child tables: stats, partners, images, goals, timeline, participants, budget
- **announcements** (`announcements:save`) — announcement_tags

### Pattern: read-only
- **contact_submissions** (`contact:list`) — user-submitted messages, only read + delete

### Image Upload
- Base64 → Buffer → Supabase Storage (`ruclub` bucket under `static/assets/`)
- Used by: missions, announcements, members, partners

## JWT Authentication Flow
1. User submits credentials → `/api/admin` (action: `login`)
2. Server validates against `ADMIN_USERNAME`/`ADMIN_PASSWORD` or `MASTER_KEY`
3. Token signed with **ES256** (ECDSA P-256) when `JWT_EC_PRIVATE_KEY` is set; **HS256** fallback
4. Token stored in localStorage under `ru_admin_token`
5. Subsequent API calls include token; server verifies ES256 first, then HS256 fallback
6. `handleUnauthorized()` debounced (5s window) — clears session, shows warning toast

## Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side (Vercel env vars only — NO VITE_ prefix)
ADMIN_USERNAME=admin@email.com
ADMIN_PASSWORD=your-password
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
MASTER_KEY=emergency-master-key
JWT_EC_PRIVATE_KEY="-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"
```

**Security note:** `VITE_`-prefixed vars are embedded in client bundle. Never use `VITE_ADMIN_USERNAME`, `VITE_ADMIN_PASSWORD`, `VITE_MASTER_KEY`, `VITE_SUPABASE_JWT_SECRET`, or `VITE_SUPABASE_SERVICE_KEY` — they won't be read by the API.

## Build & Deploy
```bash
npm run dev       # vercel dev → serves Vite frontend + API functions at localhost:3000
npm run build     # tsc -b && vite build → dist/
npx vercel --prod # deploy to ruclubadmin.vercel.app
```

## Key Conventions
- Every save is instant to DB — no publish workflow
- All pages have: loading skeleton, empty state, error handling, PageErrorBoundary
- Image previews use `storageUrl()` to resolve relative paths
- Use `useStore.getState()` for accessing store outside React components
- JWT token stored in localStorage under `ru_admin_token` prefix
- Drafts stored in localStorage under `ru_admin_draft_` prefix
- Dark mode persisted in `localStorage.theme`
- `.env` is gitignored; copy `.env.example` for local setup
- Vercel env vars must include all non-`VITE_` vars for the API function to work
