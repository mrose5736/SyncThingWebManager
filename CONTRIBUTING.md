# Contributing to Syncthing Central

Thanks for considering a contribution! This is a small project, so the process is intentionally light.

## Getting set up

```bash
git clone https://github.com/<your-fork>/SyncThingWebManager.git
cd SyncThingWebManager
npm install
npm run dev
```

`npm run dev` runs the Vite dev server (http://localhost:5173) alongside the proxy server (http://localhost:3001) with hot reload.

## Before opening a PR

Run the same checks CI runs:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

`npm run test:watch` re-runs tests on file changes while you work; `npm run test:coverage` generates a coverage report. Tests currently cover `lib/` and `store/serverStore.ts` — the highest-value, most logic-heavy parts of the app. There's no UI/component test coverage yet, so still test any UI change manually against at least one real (or locally running) Syncthing instance.

## Making changes

- Keep PRs focused — one fix or feature per PR is easier to review than a bundle of unrelated changes.
- Match the existing code style (TypeScript, functional React components, Tailwind for styling, Zustand for state).
- Add an entry to `CHANGELOG.md` under `[Unreleased]` describing your change.
- If you're changing behavior around the proxy server or API key handling, call that out explicitly in the PR description — see `SECURITY.md` for the trust model this app assumes.

## Branch / commit conventions

- Branch from `main`.
- Commit messages should explain *why* a change was made, not just what changed.
- Squash-merge is fine; keep the final PR title descriptive since it becomes the merge commit message.

## Reporting bugs / requesting features

Use the issue templates — they'll prompt for the environment details (deployment method, Syncthing version, browser) that are usually needed to reproduce a problem.

## Questions

Open a GitHub issue or discussion — there's no separate chat/forum for this project.
