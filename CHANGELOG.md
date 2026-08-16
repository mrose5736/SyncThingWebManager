# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Pages deployment for the public demo (`.github/workflows/deploy-demo.yml`) — builds and publishes the demo bundle as static files on every push to `main`, no server required since demo mode makes no real network calls
- `HashRouter` used instead of `BrowserRouter` in demo mode, and a configurable `VITE_BASE_PATH` build-time Vite `base`, so the demo works correctly at a GitHub Pages project-page subpath
- Test suite (Vitest + React Testing Library) covering `lib/syncthingApi.ts`, `lib/mockData.ts`, `lib/apiError.ts`, `lib/utils.ts`, and `store/serverStore.ts` — 57 tests, wired into CI

### Fixed
- `serverStore.addServer` called `crypto.randomUUID()` directly instead of the `uuid()` fallback helper added for non-secure (plain HTTP) contexts, silently defeating that fallback for the app's primary documented use case (LAN access over `http://`)

## [0.2.0] - 2026-08-16

### Added
- `.gitignore` and MIT `LICENSE` file
- CI workflow (lint, typecheck, build) via GitHub Actions
- `CONTRIBUTING.md` and `SECURITY.md`
- Issue and pull request templates
- Docker / Docker Compose deployment option
- Public demo mode (`docker-compose.demo.yml`, `VITE_DEMO_MODE`/`DEMO_MODE`) — serves mock data client-side and hard-disables the proxy, so a demo instance can safely run on the public internet
- This changelog

### Changed
- `node_modules` and `dist` are no longer tracked in git
- Moved `express` and `cors` from `devDependencies` to `dependencies` in `package.json` (they're required at runtime by `proxy-server.mjs`; this was breaking production-only installs, including the new Docker image)

### Fixed
- `npm run lint` was broken (no `eslint.config.js` existed for ESLint 9's flat-config format); added one matching the existing React/TypeScript stack

## [0.1.0] - 2026-08-16

Initial public preview.

### Added
- Multi-server Syncthing dashboard (React + TypeScript + Vite)
- Per-server and global folder controls (pause/resume/rescan)
- Sync conflict and pull error viewer
- Express proxy server for CORS-free access to Syncthing's REST API
- `install.sh` / `install.ps1` setup scripts with PM2 process management
