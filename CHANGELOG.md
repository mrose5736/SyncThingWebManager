# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-16

First public release.

### Added
- `.gitignore` and MIT `LICENSE` file
- CI workflow (lint, typecheck, test, build) via GitHub Actions
- `CONTRIBUTING.md`, `SECURITY.md`, and `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1)
- Issue and pull request templates
- Docker / Docker Compose deployment option
- Public demo mode (`docker-compose.demo.yml`, `VITE_DEMO_MODE`/`DEMO_MODE`) — serves mock data client-side and hard-disables the proxy, so a demo instance can safely run on the public internet
- GitHub Pages deployment for the public demo (`.github/workflows/deploy-demo.yml`) — builds and publishes the demo bundle as static files on every push to `main`, no server required since demo mode makes no real network calls
- `HashRouter` used instead of `BrowserRouter` in demo mode, and a configurable `VITE_BASE_PATH` build-time Vite `base`, so the demo works correctly at a GitHub Pages project-page subpath
- Test suite (Vitest + React Testing Library) covering `lib/syncthingApi.ts`, `lib/mockData.ts`, `lib/apiError.ts`, `lib/utils.ts`, `store/serverStore.ts`, and `components/ErrorBoundary.tsx` — 59 tests, wired into CI
- Top-level React error boundary (`components/ErrorBoundary.tsx`) — an uncaught render error now shows a recoverable "Something went wrong" screen with a reload button instead of a blank page, since this app is meant to run unattended as a monitoring dashboard
- Dependabot configuration (`.github/dependabot.yml`) for weekly automated dependency PRs (npm, GitHub Actions, Docker base image)
- This changelog

### Changed
- `node_modules` and `dist` are no longer tracked in git
- Moved `express` and `cors` from `devDependencies` to `dependencies` in `package.json` (they're required at runtime by `proxy-server.mjs`; this was breaking production-only installs, including the Docker image)

### Fixed
- `npm run lint` was broken (no `eslint.config.js` existed for ESLint 9's flat-config format); added one matching the existing React/TypeScript stack
- `serverStore.addServer` called `crypto.randomUUID()` directly instead of the `uuid()` fallback helper added for non-secure (plain HTTP) contexts, silently defeating that fallback for the app's primary documented use case (LAN access over `http://`)

### Security
- Upgraded `react-router-dom` 6 → 7, resolving two moderate-severity advisories ([GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), [GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg)). `npm audit` is now clean. Verified both routing modes manually (`BrowserRouter` for self-hosted, `HashRouter` for the static demo) — no API changes needed since the app only uses the classic declarative router, not v7's framework mode.

## [0.1.0] - 2026-08-16

Initial public preview.

### Added
- Multi-server Syncthing dashboard (React + TypeScript + Vite)
- Per-server and global folder controls (pause/resume/rescan)
- Sync conflict and pull error viewer
- Express proxy server for CORS-free access to Syncthing's REST API
- `install.sh` / `install.ps1` setup scripts with PM2 process management
