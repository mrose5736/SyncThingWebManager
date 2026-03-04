import {
    SyncthingApiError,
    type ApiErrorType,
} from './apiError';
import type {
    SystemStatus,
    FolderStats,
    SyncthingConfig,
    ConfigFolder,
    DeviceConnections,
} from '@/types/syncthing';

/**
 * Typed REST API client for a single Syncthing instance.
 *
 * All requests are routed through the proxy server at /proxy.
 * - Development (npm run dev): proxy runs on localhost:3001, Vite on localhost:5173.
 *   We use an absolute URL so cross-port requests work.
 * - Production (npm start): proxy and frontend share the same origin, so /proxy
 *   is a simple same-origin relative URL with zero CORS overhead.
 */

// In dev mode Vite and the proxy are on different ports → need absolute URL.
// In production they share the same origin → relative URL is cleaner & portable.
const PROXY_URL = import.meta.env.DEV
    ? 'http://localhost:3001/proxy'
    : '/proxy';

export class SyncthingClient {
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor(url: string, apiKey: string) {
        // Normalise: strip trailing slash
        this.baseUrl = url.replace(/\/+$/, '');
        this.apiKey = apiKey;
    }

    // ─── Private helpers ───────────────────────────────────────────────────────

    private async request<T>(
        path: string,
        options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
    ): Promise<T> {
        let response: Response;

        try {
            response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: this.baseUrl,
                    path,
                    method: options.method ?? 'GET',
                    apiKey: this.apiKey,
                    body: options.body,
                }),
                signal: options.signal ?? AbortSignal.timeout(12_000),
            });
        } catch (err) {
            // This means the proxy itself is unreachable (not running)
            const message = err instanceof Error ? err.message : String(err);
            throw new SyncthingApiError(
                `Proxy server unreachable: ${message}. Is the proxy running? Try restarting with "npm run dev".`,
                'OFFLINE',
            );
        }

        // Proxy returns 502 when upstream (Syncthing) is unreachable
        if (response.status === 502) {
            const body = await response.json().catch(() => ({})) as { error?: string };
            throw new SyncthingApiError(
                body.error ?? 'Cannot reach the Syncthing server. Check the URL and ensure Syncthing is running.',
                'OFFLINE',
                502,
            );
        }

        if (response.status === 403 || response.status === 401) {
            throw new SyncthingApiError(
                'Authentication failed. The API key may be invalid.',
                'AUTH',
                response.status,
            );
        }

        if (!response.ok) {
            throw new SyncthingApiError(
                `HTTP ${response.status}: ${response.statusText}`,
                'UNKNOWN' as ApiErrorType,
                response.status,
            );
        }

        // Some endpoints return empty body on success (e.g. POST)
        const text = await response.text();
        if (!text) return {} as T;

        try {
            return JSON.parse(text) as T;
        } catch {
            throw new SyncthingApiError('Failed to parse response JSON.', 'UNKNOWN');
        }
    }

    // ─── System endpoints ──────────────────────────────────────────────────────

    /** GET /rest/system/status */
    async getSystemStatus(signal?: AbortSignal): Promise<SystemStatus> {
        return this.request<SystemStatus>('/rest/system/status', { signal });
    }

    /** POST /rest/system/ping — lightweight check */
    async ping(signal?: AbortSignal): Promise<{ ping: string }> {
        return this.request<{ ping: string }>('/rest/system/ping', { signal });
    }

    /** POST /rest/system/restart */
    async restart(): Promise<void> {
        await this.request<void>('/rest/system/restart', { method: 'POST' });
    }

    /** POST /rest/system/shutdown */
    async shutdown(): Promise<void> {
        await this.request<void>('/rest/system/shutdown', { method: 'POST' });
    }

    // ─── Config endpoints ──────────────────────────────────────────────────────

    /** GET /rest/config */
    async getConfig(signal?: AbortSignal): Promise<SyncthingConfig> {
        return this.request<SyncthingConfig>('/rest/config', { signal });
    }

    /** PUT /rest/config/folders/:id — update a single folder */
    async updateFolder(folder: ConfigFolder): Promise<void> {
        await this.request<void>(`/rest/config/folders/${folder.id}`, {
            method: 'PUT',
            body: folder,
        });
    }

    // ─── Database / folder status ──────────────────────────────────────────────

    /** GET /rest/db/status?folder=<id> */
    async getFolderStatus(folderId: string, signal?: AbortSignal): Promise<FolderStats> {
        return this.request<FolderStats>(
            `/rest/db/status?folder=${encodeURIComponent(folderId)}`,
            { signal },
        );
    }

    /** POST /rest/db/scan?folder=<id> — trigger a rescan */
    async rescanFolder(folderId: string): Promise<void> {
        await this.request<void>(
            `/rest/db/scan?folder=${encodeURIComponent(folderId)}`,
            { method: 'POST' },
        );
    }

    /** POST /rest/db/scan — rescan all folders */
    async rescanAll(): Promise<void> {
        await this.request<void>('/rest/db/scan', { method: 'POST' });
    }

    // ─── Folder pause / resume ─────────────────────────────────────────────────

    /** Pause a single folder by patching its config */
    async pauseFolder(folderId: string, config: SyncthingConfig): Promise<void> {
        const folder = config.folders.find((f) => f.id === folderId);
        if (!folder) throw new SyncthingApiError(`Folder ${folderId} not found`, 'UNKNOWN');
        await this.updateFolder({ ...folder, paused: true });
    }

    /** Resume a single folder by patching its config */
    async resumeFolder(folderId: string, config: SyncthingConfig): Promise<void> {
        const folder = config.folders.find((f) => f.id === folderId);
        if (!folder) throw new SyncthingApiError(`Folder ${folderId} not found`, 'UNKNOWN');
        await this.updateFolder({ ...folder, paused: false });
    }

    /** Pause ALL folders */
    async pauseAllFolders(config: SyncthingConfig): Promise<void> {
        await Promise.allSettled(
            config.folders.map((f) => this.updateFolder({ ...f, paused: true })),
        );
    }

    /** Resume ALL folders */
    async resumeAllFolders(config: SyncthingConfig): Promise<void> {
        await Promise.allSettled(
            config.folders.map((f) => this.updateFolder({ ...f, paused: false })),
        );
    }

    // ─── Connections ───────────────────────────────────────────────────────────

    /** GET /rest/system/connections */
    async getConnections(signal?: AbortSignal): Promise<DeviceConnections> {
        return this.request<DeviceConnections>('/rest/system/connections', { signal });
    }

    // ─── Static helpers ────────────────────────────────────────────────────────

    /** Create a client from stored ServerConfig */
    static fromConfig(cfg: { url: string; apiKey: string }): SyncthingClient {
        return new SyncthingClient(cfg.url, cfg.apiKey);
    }
}
