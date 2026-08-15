# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `.gitignore` and MIT `LICENSE` file
- CI workflow (lint, typecheck, build) via GitHub Actions
- `CONTRIBUTING.md` and `SECURITY.md`
- Issue and pull request templates
- Docker / Docker Compose deployment option
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
