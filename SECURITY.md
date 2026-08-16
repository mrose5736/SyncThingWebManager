# Security Policy

## Trust model — please read before deploying

Syncthing Central is designed for use on a **trusted local network** (home LAN, homelab, private VPN). It is **not** designed to be exposed directly to the public internet. Specifically:

- **API keys are stored in plaintext** in the browser's `localStorage`. Anyone with access to the browser profile, or to a stolen/synced browser backup, can read them.
- **There is no authentication layer** in front of the app itself. Anyone who can reach the web UI can add/remove managed Syncthing servers and issue commands against them.
- **The proxy server (`proxy-server.mjs`) will forward requests to any URL and API key a client sends it.** This is intentional — it's how the app avoids browser CORS restrictions when talking to multiple Syncthing instances — but it means the proxy has no allowlist and should never be reachable from an untrusted network. If exposed publicly, it can be used as an open relay to probe or hit arbitrary HTTP endpoints reachable from the host.
- By default the server binds to `0.0.0.0`, i.e. it's reachable from any device on your local network. Set `HOST=127.0.0.1` to restrict it to localhost only, or put it behind a firewall / reverse proxy with its own auth if you need remote access.

If you need to access this outside your LAN, put it behind a VPN (e.g. WireGuard, Tailscale) or a reverse proxy that adds authentication (e.g. an `nginx`/`Caddy` basic-auth gate, or an identity-aware proxy) — do not port-forward it directly.

### Running a public demo

If you want to show the app off on the public internet (e.g. a project demo site), **do not** run a normal build — use demo mode (`docker compose -f docker-compose.demo.yml up -d --build`, or `VITE_DEMO_MODE=true` at build time / `DEMO_MODE=true` at runtime). In this mode:

- The frontend never issues a real network request — all data is generated client-side in memory.
- The proxy server refuses every `/proxy` request with `403`, regardless of what's sent, closing off the open-relay risk entirely.

Even so, treat it like any public-facing web app: serve it over HTTPS, put a rate limiter/WAF in front (e.g. Cloudflare), and don't assume a "read-only" demo means it can't be abused for resource exhaustion (basic rate limiting still matters).

## Reporting a vulnerability

If you find a security issue (e.g. a way to bypass the LAN-only trust model, an injection vector in the proxy, XSS in the dashboard), please report it privately rather than opening a public issue:

- Use GitHub's [private vulnerability reporting](../../security/advisories/new) for this repository, if enabled, **or**
- Open a regular issue with minimal detail asking for a private channel to share specifics, and a maintainer will follow up.

Please include:
- A description of the issue and its impact
- Steps to reproduce
- Affected version/commit

We'll aim to acknowledge reports within a few days. This is a small open-source project maintained on a best-effort basis, so response times may vary.

## Supported versions

Only the latest release on `main` is supported. There is no long-term-support branch at this stage.
