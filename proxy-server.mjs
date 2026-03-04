/**
 * Syncthing Central – Combined Server (proxy-server.mjs)
 *
 * DEVELOPMENT MODE (npm run dev):
 *   Runs on http://localhost:3001 — proxy only.
 *   Vite serves the frontend on http://localhost:5173.
 *
 * PRODUCTION MODE (npm start, after npm run build):
 *   Runs on http://0.0.0.0:PORT (default 3001).
 *   Serves the built frontend from ./dist/ AND handles /proxy requests.
 *   Accessible from any device on the local network.
 *   Set PORT env var to change port.
 *
 * USAGE:
 *   npm run build   # Build the frontend
 *   npm start       # Start production server
 */

import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const DIST_DIR = join(__dirname, 'dist');
const IS_PROD = existsSync(DIST_DIR);

// In dev mode, allow localhost Vite origin. In prod, same-origin so no CORS needed.
if (!IS_PROD) {
    app.use(cors({ origin: /^http:\/\/localhost(:\d+)?$/ }));
}

app.use(express.json({ limit: '2mb' }));

// ─── Proxy endpoint ────────────────────────────────────────────────────────
// Forwards browser requests to Syncthing instances (avoids browser CORS).

app.post('/proxy', async (req, res) => {
    const { url, path, method = 'GET', apiKey, body } = req.body ?? {};

    if (!url || !path || !apiKey) {
        res.status(400).json({ error: 'Missing required fields: url, path, apiKey' });
        return;
    }

    if (!/^https?:\/\//i.test(url)) {
        res.status(400).json({ error: 'url must start with http:// or https://' });
        return;
    }

    const target = `${url.replace(/\/+$/, '')}${path}`;

    try {
        const upstream = await fetch(target, {
            method,
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
            },
            ...(body ? { body: JSON.stringify(body) } : {}),
            signal: AbortSignal.timeout(12_000),
        });

        const text = await upstream.text();
        res.status(upstream.status);
        const ct = upstream.headers.get('content-type');
        if (ct) res.setHeader('Content-Type', ct);
        res.send(text);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[proxy] Error forwarding to ${target}:`, message);
        res.status(502).json({ error: `Upstream unreachable: ${message}` });
    }
});

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', port: PORT, mode: IS_PROD ? 'production' : 'development' });
});

// ─── Static frontend (production only) ────────────────────────────────────
if (IS_PROD) {
    app.use(express.static(DIST_DIR));
    // SPA fallback — serve index.html for all non-API routes (Express 5 compatible)
    app.get('/{*splat}', (_req, res) => {
        res.sendFile(join(DIST_DIR, 'index.html'));
    });
}

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
    if (IS_PROD) {
        console.log(`\n  ✅ Syncthing Central running in PRODUCTION mode`);
        console.log(`  🌐 Open from this machine:  http://localhost:${PORT}`);
        console.log(`  🌐 Open from your network:  http://<this-machine-ip>:${PORT}`);
        console.log(`  🔀 Proxy endpoint:          http://localhost:${PORT}/proxy\n`);
    } else {
        console.log(`\n  🔀 Syncthing Proxy ready on http://localhost:${PORT}/proxy  [dev mode]\n`);
    }
});
