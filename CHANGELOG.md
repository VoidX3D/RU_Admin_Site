# Changelog

All notable changes to the RU Club Motherland Admin Panel are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.2] - 2026-06-13

### Added
- Featured image selector — star icon to pick any uploaded image as the mission cover
- Auto-rename uploaded images to `img-01.jpg`, `img-02.jpg`, etc.
- Auto-set first image as featured when no featured is set
- `featuredIndex` / `onFeaturedChange` props on `ImageUpload` component

### Changed
- Image upload dropzone redesigned — larger, animated hover scale, improved drag feedback
- Image cards redesigned — grid layout with aspect-video, hover border effects, featured highlight (emerald border + glow)
- Upload progress replaced inline spinner with animated card with Framer Motion
- Hint text now shows star icon + "Click the star to set the featured cover image"

### Fixed
- Removing the featured image now correctly picks the first remaining image
- Image index shifts properly when reordering with a featured image set
- Null/empty featured image handled cleanly in delta saves
- Image names now always position-based — no naming collisions after remove/reorder
- Upload progress bar shows correct counts ("Uploading 1 of 3" instead of "1 of 1")
- Removed images now deleted from Supabase Storage bucket (no orphaned files)
- `storagePath` tracked per-image for reliable bucket cleanup on remove
- Server-side `image:delete` API handler added for bucket deletion
- `extractStoragePath()` helper extracts storage path from public URL for deletion tracking
- Renumber helper reindexes all image names positionally on every add/remove/reorder
- API delete handler ignores "not found" errors (idempotent)
- Draft restore now also extracts storage paths from URLs

## [1.0.1] - 2026-06-13

### Fixed
- All `<img>` tags now have explicit `width` and `height` attributes to prevent CLS
- Login email validation — validates format when input contains `@`
- Removed unused `useCallback` import in MissionsPage
- Removed dead `supabaseAnon` client code
- Replaced non-standard `html { zoom: 1.10 }` with `font-size: 110%`

### Changed
- Updated README.md to reflect correct React version (18.3), routing (Zustand), and env var names
- Main site URL updated to `ruclub.rweb.site`

### Added
- Initial CHANGELOG.md

## [1.0.0] - 2026-05-01

### Added
- Initial release — full CRUD admin panel for missions, announcements, members, stats, partners, contact submissions
- JWT authentication with ES256/HS256 support
- Image upload to Supabase Storage with retry logic
- Delta-only saves to prevent overwrites
- Drafts system for unsaved changes
- Keyboard shortcuts (Ctrl+S to save)
- Dark/light theme support
