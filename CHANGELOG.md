# Changelog

All notable changes to the RU Club Motherland Admin Panel are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
