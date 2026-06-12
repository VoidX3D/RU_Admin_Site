# AGENTS — Admin Panel Guide

## Overview
RU Club Motherland Admin Panel — a **React 19 + TypeScript + Vite 7** SPA for managing all dynamic content on `ruclub.motherland.edu.np`. Every save writes directly to Supabase. Deployed at `ruclubadmin.vercel.app`. Authentication via JWT + environment variable credentials.

## Tech Stack
- **Framework:** React 18.3 + TypeScript
- **Build:** Vite 7 + Tailwind CSS v3
- **Routing:** Zustand-based view switching (no React Router)
- **Backend:** Supabase (Postgres + Storage), accessed via **service key** (`supabaseAdmin`) to bypass RLS
- **Animations:** Framer Motion
- **State:** Zustand (`store.ts`)
- **Auth:** JWT-based login via `/api/admin` endpoint with HMAC-SHA256

## Architecture
```
/src
├── App.tsx                  → Root: lazy-loaded pages, auth gate, connection check
├── main.tsx                 → Entry, renders App
├── App.css                  → Tailwind + KaTeX + scrollbar styles
├── store.ts                 → Zustand store (auth, view, toasts, drafts, DB status)
├── types.ts                 → All TypeScript interfaces
├── utils/
│   ├── supabase.ts          → ALL DB operations via /api/admin endpoint
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
│   ├── Login.tsx            → JWT login with Remember Me, master key, rate limiting
│   ├── Layout.tsx           → Sidebar nav + header + ConnectionStatus + logout
│   ├── Dashboard.tsx        → Stat cards + quick actions
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
│   ├── ConnectionStatus.tsx → Live DB connection indicator
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
    └── admin.ts             → Vercel serverless handler (all DB ops, auth, image upload)
```

## Pages & View Switching
| View | Component | Data | Notes |
|---|---|---|---|
| `login` | Login | env vars | JWT auth, rate-limited, master key support |
| `dashboard` | Dashboard | DB stats | Stat cards + quick actions |
| `missions` | MissionsPage | 7 sub-tables | Full CRUD + drafts + PageErrorBoundary |
| `announcements` | AnnouncementsPage | Tags + image | Full CRUD + drafts + PageErrorBoundary |
| `members` | MembersPage | 3 groups | CSV/JSON export + validation |
| `stats` | StatsEditorPage | Rows | Delete-all-then-insert |
| `partners` | PartnersEditorPage | Rows + images | Delete-all-then-insert |
| `contact` | ContactSubmissions | Read-only | Paginated (50/page) + email validation |
| `settings` | SettingsPage | localStorage | Backup/restore, DB status |
| `help` | HelpPage | Static | Keyboard shortcuts guide |

## Key Features Implemented
- **Authentication:** JWT-based login with HMAC-SHA256, "Remember Me" (7-day session), master key bypass, rate limiting (5 attempts → 15-min lockout), inactivity timeout (30 min)
- **Connection Status:** Live DB indicator in header, auto-checks every 30s, color-coded (green/red/yellow)
- **Validation:** Required fields, email format, slug format (lowercase-hyphens), date format, image file types, character limits, duplicate slug detection
- **Image Upload:** Drag-and-drop, compression (max 1920px), retry on failure (3 attempts with exponential backoff), progress bar, preview before upload
- **Error Handling:** Global ErrorBoundary with chunk error detection + cache reset, PageErrorBoundary per page with Reset button
- **Drafts:** Auto-save every 30s, restore on new/edit, clear on save, age indicator, localStorage quota handling
- **Keyboard Shortcuts:** Ctrl+1/2 new mission/announcement, Ctrl+D/M/U navigation, Ctrl+Shift+A/C/S for announcements/contact/settings, Ctrl+? for help
- **Performance:** Contact submissions paginated (50/page), memoized filtered lists, debounced search
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

## Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side (Vercel env vars, never in .env)
ADMIN_USERNAME=admin@email.com
ADMIN_PASSWORD=your-password
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
MASTER_KEY=emergency-master-key
```

## Build
```bash
npm run dev       # vite dev server
npm run build     # tsc -b && vite build → dist/
```

## Key Conventions
- Every save is instant to DB — no publish workflow
- All pages have: loading skeleton, empty state, error handling, PageErrorBoundary
- Image previews use `storageUrl()` to resolve relative paths
- use `useStore.getState()` for accessing store outside React components
- JWT token stored in localStorage under `ru_admin_token` prefix
- Drafts stored in localStorage under `ru_admin_draft_` prefix
- Dark mode persisted in `localStorage.theme`
