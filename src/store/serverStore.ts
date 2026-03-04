import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ServerConfig, ServerHealth, FolderStats, SyncthingConfig, DeviceConnections, SystemStatus } from '@/types/syncthing';
import { SyncthingClient } from '@/lib/syncthingApi';
import { SyncthingApiError } from '@/lib/apiError';

// Default health for a new server
function defaultHealth(): ServerHealth {
    return {
        status: 'loading',
        lastPollAt: null,
        error: null,
        systemStatus: null,
        connections: null,
        config: null,
        folderStats: {},
    };
}

interface ServerStore {
    // ─── Persisted ────────────────────────────────────────────────────────────
    servers: ServerConfig[];

    // ─── Runtime (not persisted) ──────────────────────────────────────────────
    health: Record<string, ServerHealth>;
    pollingIntervals: Record<string, ReturnType<typeof setInterval>>;
    pollingMs: number;

    // ─── CRUD ─────────────────────────────────────────────────────────────────
    addServer: (cfg: Omit<ServerConfig, 'id'>) => string;
    updateServer: (id: string, patch: Partial<Omit<ServerConfig, 'id'>>) => void;
    removeServer: (id: string) => void;

    // ─── Polling ──────────────────────────────────────────────────────────────
    startPolling: (id: string) => void;
    stopPolling: (id: string) => void;
    startAllPolling: () => void;
    stopAllPolling: () => void;
    pollOnce: (id: string) => Promise<void>;

    // ─── Settings ─────────────────────────────────────────────────────────────
    setPollingMs: (ms: number) => void;

    // ─── Actions forwarded to API ──────────────────────────────────────────────
    pauseAllFolders: (serverId: string) => Promise<void>;
    resumeAllFolders: (serverId: string) => Promise<void>;
    rescanAll: (serverId: string) => Promise<void>;
}

export const useServerStore = create<ServerStore>()(
    persist(
        (set, get) => ({
            servers: [],
            health: {},
            pollingIntervals: {},
            pollingMs: 5000,

            // ─── CRUD ───────────────────────────────────────────────────────────────
            addServer: (cfg) => {
                const id = crypto.randomUUID();
                const server: ServerConfig = { id, ...cfg };
                set((s) => ({
                    servers: [...s.servers, server],
                    health: { ...s.health, [id]: defaultHealth() },
                }));
                // Start polling immediately
                setTimeout(() => get().startPolling(id), 0);
                return id;
            },

            updateServer: (id, patch) => {
                set((s) => ({
                    servers: s.servers.map((srv) =>
                        srv.id === id ? { ...srv, ...patch } : srv,
                    ),
                }));
                // Re-start polling with updated credentials
                get().stopPolling(id);
                get().startPolling(id);
            },

            removeServer: (id) => {
                get().stopPolling(id);
                set((s) => {
                    const { [id]: _h, ...health } = s.health;
                    return {
                        servers: s.servers.filter((srv) => srv.id !== id),
                        health,
                    };
                });
            },

            // ─── Polling ─────────────────────────────────────────────────────────
            pollOnce: async (id) => {
                const srv = get().servers.find((s) => s.id === id);
                if (!srv) return;

                const client = SyncthingClient.fromConfig(srv);

                const setHealth = (patch: Partial<ServerHealth>) =>
                    set((s) => ({
                        health: {
                            ...s.health,
                            [id]: { ...s.health[id], ...patch },
                        },
                    }));

                try {
                    const controller = new AbortController();
                    const signal = controller.signal;

                    // Fetch system status + config + connections in parallel
                    const [systemStatus, config, connections] = await Promise.all([
                        client.getSystemStatus(signal),
                        client.getConfig(signal),
                        client.getConnections(signal),
                    ]);

                    // Fetch per-folder stats
                    const folderStats: Record<string, FolderStats> = {};
                    await Promise.allSettled(
                        (config.folders ?? []).map(async (f) => {
                            try {
                                folderStats[f.id] = await client.getFolderStatus(f.id, signal);
                            } catch {
                                // Individual folder failure is non-fatal
                            }
                        }),
                    );

                    setHealth({
                        status: 'online',
                        lastPollAt: Date.now(),
                        error: null,
                        systemStatus: systemStatus as SystemStatus,
                        config: config as SyncthingConfig,
                        connections: connections as DeviceConnections,
                        folderStats,
                    });
                } catch (err) {
                    let status: ServerHealth['status'] = 'offline';
                    let errorMsg = 'Unknown error';

                    if (err instanceof SyncthingApiError) {
                        errorMsg = err.advice;
                        if (err.type === 'AUTH') status = 'auth_error';
                    } else if (err instanceof Error) {
                        errorMsg = err.message;
                    }

                    setHealth({
                        status,
                        error: errorMsg,
                        lastPollAt: Date.now(),
                    });
                }
            },

            startPolling: (id) => {
                // Clear existing interval if any
                const existing = get().pollingIntervals[id];
                if (existing) clearInterval(existing);

                // Poll immediately, then on interval
                void get().pollOnce(id);
                const interval = setInterval(() => void get().pollOnce(id), get().pollingMs);

                set((s) => ({
                    pollingIntervals: { ...s.pollingIntervals, [id]: interval },
                }));
            },

            stopPolling: (id) => {
                const interval = get().pollingIntervals[id];
                if (interval) clearInterval(interval);
                set((s) => {
                    const { [id]: _removed, ...rest } = s.pollingIntervals;
                    return { pollingIntervals: rest };
                });
            },

            startAllPolling: () => {
                get().servers.forEach((srv) => get().startPolling(srv.id));
            },

            stopAllPolling: () => {
                get().servers.forEach((srv) => get().stopPolling(srv.id));
            },

            setPollingMs: (ms) => {
                set({ pollingMs: ms });
                // Restart all polling with new interval
                get().stopAllPolling();
                get().startAllPolling();
            },

            // ─── API Actions ─────────────────────────────────────────────────────
            pauseAllFolders: async (serverId) => {
                const srv = get().servers.find((s) => s.id === serverId);
                const cfg = get().health[serverId]?.config;
                if (!srv || !cfg) return;
                await SyncthingClient.fromConfig(srv).pauseAllFolders(cfg);
                await get().pollOnce(serverId);
            },

            resumeAllFolders: async (serverId) => {
                const srv = get().servers.find((s) => s.id === serverId);
                const cfg = get().health[serverId]?.config;
                if (!srv || !cfg) return;
                await SyncthingClient.fromConfig(srv).resumeAllFolders(cfg);
                await get().pollOnce(serverId);
            },

            rescanAll: async (serverId) => {
                const srv = get().servers.find((s) => s.id === serverId);
                if (!srv) return;
                await SyncthingClient.fromConfig(srv).rescanAll();
            },
        }),
        {
            name: 'syncthing-central-servers',
            // Only persist the server list and polling interval; health is runtime-only
            partialize: (state) => ({
                servers: state.servers,
                pollingMs: state.pollingMs,
            }),
            onRehydrateStorage: () => (state) => {
                // After rehydration, kick off polling for all saved servers
                if (state) {
                    // Give React time to mount before polling
                    setTimeout(() => state.startAllPolling(), 500);
                }
            },
        },
    ),
);
