# RU Club Motherland — Admin Panel

A React 19 + TypeScript + Vite SPA for managing all dynamic content on [ruclub.motherland.edu.np](https://ruclub.motherland.edu.np). Every save writes directly to Supabase with no draft/publish workflow.

**Deployed at:** [ruclubadmin.vercel.app](https://ruclubadmin.vercel.app)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 + Tailwind CSS v4 |
| Routing | HashRouter (React Router DOM v7) |
| Backend | Supabase (Postgres + Storage) |
| Animations | Framer Motion |
| State | Zustand |
| Auth | Username/password login + optional `VITE_MASTER_KEY` override |

## Features

- **Dashboard** — Live stats from Supabase, saved drafts list, quick actions
- **Missions** — Full CRUD with 7 child tables (stats, partners, images, goals, timeline, participants, budget) + image upload to Supabase Storage
- **Announcements** — Full CRUD with status/date/location fields, tags, gallery, image upload
- **Members** — Tabbed inline editing for Teachers/Core/General, avatar upload, member types
- **Global Stats** — Key-value stat rows for homepage counters
- **Partners** — Partner logos with name/alt and image upload
- **Contact Submissions** — Read-only viewer with detail panel, delete capability
- **Settings** — Text reformatting, data migration tooling
- **Theme** — Light/dark mode toggle, persists to localStorage
- **Keyboard Shortcuts** — Ctrl+1/2 new mission/announcement, Ctrl+D/M/A/U navigation

## Project Structure

```
src/
├── App.tsx                  — HashRouter with all routes + AnimatePresence
├── main.tsx                 — Entry point
├── index.css                — Tailwind v4 + dark theme + animations
├── store.ts                 — Zustand store (view, toasts, theme, etc.)
├── types.ts                 — TypeScript interfaces matching Supabase schema
├── utils/
│   ├── supabase.ts          — ALL DB operations (CRUD for 15 tables)
│   ├── storage.ts           — Session + settings persistence (localStorage)
│   ├── helpers.ts           — Utility functions
│   ├── backup.ts            — Import/export settings & drafts
│   ├── image.ts             — Image compression + processing (client-side)
│   ├── env.ts               — Environment variable config (VITE_ prefixed)
│   └── crypto.ts            — SHA-256 hashing for login
├── components/
│   ├── Layout.tsx           — Sidebar nav + header + content area
│   ├── Login.tsx            — Canvas-animated login with rate limiting + master key
│   ├── Dashboard.tsx        — Stat cards, quick actions, saved drafts
│   ├── MissionsPage.tsx     — Mission CRUD with all 7 child sections
│   ├── AnnouncementsPage.tsx— Announcement CRUD with status/tags/gallery
│   ├── MembersPage.tsx      — Tabbed inline member editing
│   ├── StatsEditorPage.tsx  — Global stats management
│   ├── PartnersEditorPage.tsx— Partner logo management
│   ├── ContactSubmissions.tsx— Contact form viewer
│   ├── SettingsPage.tsx     — Auth, repo config, backup, branches
│   ├── HelpPage.tsx         — Keyboard shortcuts + usage guide
│   ├── Icons.tsx            — 55+ SVG icon components
│   ├── ErrorBoundary.tsx    — Global error boundary
│   └── form/               — Reusable form components
│       ├── Field.tsx        — Text input with label + error
│       ├── Textarea.tsx     — Textarea with label + error
│       ├── Select.tsx       — Dropdown select
│       ├── Toggle.tsx       — On/off switch
│       ├── ImageUpload.tsx  — Drag & drop image picker
│       ├── StatsEditor.tsx  — Key-value row editor
│       ├── PartnersEditor.tsx — String list editor
│       ├── GoalsEditor.tsx  — Goal list editor
│       ├── TimelineEditor.tsx — Timeline entry editor
│       ├── ParticipantsEditor.tsx — Participant group editor
│       └── BudgetEditor.tsx — Budget item editor
```

## Database Schema

The app connects to a Supabase project with 15 tables. All CRUD operations use the **service role key** (`supabaseAdmin`) to bypass Row-Level Security.

### Tables

| Table | Purpose | CRUD Pattern |
|-------|---------|-------------|
| `stats` | Homepage stat counters | delete-all + insert |
| `partners` | Partner organization logos | delete-all + insert |
| `members` | Club members with type + group | delete-all + insert |
| `missions` | Mission entries | upsert |
| `mission_images` | Mission gallery images | delete-all + insert (child) |
| `mission_stats` | Mission-specific stats | delete-all + insert (child) |
| `mission_partners` | Mission partners | delete-all + insert (child) |
| `mission_goals` | Mission goals | delete-all + insert (child) |
| `mission_timeline` | Mission timeline entries | delete-all + insert (child) |
| `mission_participants` | Mission participant groups | delete-all + insert (child) |
| `mission_budget` | Mission budget items | delete-all + insert (child) |
| `announcements` | Club announcements | upsert |
| `announcement_tags` | Announcement tags | delete-all + insert (child) |
| `announcement_gallery` | Announcement gallery images | delete-all + insert (child) |
| `contact_submissions` | Contact form (read-only) | read + delete |

## Setup

### 1. Clone and install

```bash
git clone https://github.com/VoidX3D/RU_Admin_Site.git
cd RU_Admin_Site
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Production mode
VITE_PRODUCTION_MODE=true
```

> **Server-only env vars** (set in Vercel dashboard, never in `.env`):
> - `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` — Supabase project credentials
> - `ADMIN_USERNAME` — login identifier (email or username); the local part (before `@`) also works
> - `ADMIN_PASSWORD` — plaintext admin password
> - `SUPABASE_JWT_SECRET` — JWT secret from Supabase dashboard (Settings → API → JWT Secret); used to sign session tokens
> - `MASTER_KEY` — optional; enter as password to bypass normal auth with any username

### 3. Run

```bash
npm run dev       # Development server
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Set all `VITE_*` environment variables in Vercel dashboard
4. Deploy — `vercel.json` handles SPA routing automatically

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `#/dashboard` | Dashboard | Live stats, quick actions, drafts |
| `#/missions` | MissionsPage | Mission CRUD with all data |
| `#/announcements` | AnnouncementsPage | Announcement CRUD |
| `#/members` | MembersPage | Member management |
| `#/stats` | StatsEditorPage | Global stats |
| `#/partners` | PartnersEditorPage | Partner logos |
| `#/contact` | ContactSubmissions | Contact form submissions |
| `#/settings` | SettingsPage | Configuration |
| `#/help` | HelpPage | Usage guide |
| `*` | → Dashboard | Redirect |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save current draft |
| `Ctrl+Shift+P` | Open publish dialog |
| `Esc` | Cancel / close |
| `Ctrl+1` | New mission |
| `Ctrl+2` | New announcement |
| `Ctrl+D` | Dashboard |
| `Ctrl+M` | Missions |
| `Ctrl+A` | Announcements |
| `Ctrl+U` | Members |
| `Ctrl+Shift+S` | Settings |

## Credits

Built by **Sincere Bhattarai** ([@VoidX3D](https://github.com/VoidX3D)) for RU Club Motherland.  
Managed by **Motherland Secondary School**, Pokhara, Nepal.

## License

MIT — see [LICENSE](LICENSE) for details.
