import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useServerStore } from './serverStore';
import { SyncthingApiError } from '@/lib/apiError';
import { SyncthingClient } from '@/lib/syncthingApi';

vi.mock('@/lib/syncthingApi', () => ({
    SyncthingClient: { fromConfig: vi.fn() },
}));

function resetStore() {
    useServerStore.getState().stopAllPolling();
    useServerStore.setState({
        servers: [],
        health: {},
        pollingIntervals: {},
        pollingMs: 5000,
    });
    window.localStorage.clear();
}

function mockClient(overrides: Record<string, unknown> = {}) {
    const client = {
        getSystemStatus: vi.fn().mockResolvedValue({ myID: 'abc', cpuPercent: 1, alloc: 1 }),
        getConfig: vi.fn().mockResolvedValue({ folders: [], devices: [] }),
        getConnections: vi.fn().mockResolvedValue({ connections: {}, total: {} }),
        getFolderStatus: vi.fn().mockResolvedValue({ globalBytes: 0, needBytes: 0 }),
        pauseAllFolders: vi.fn().mockResolvedValue(undefined),
        resumeAllFolders: vi.fn().mockResolvedValue(undefined),
        rescanAll: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
    vi.mocked(SyncthingClient.fromConfig).mockReturnValue(client as unknown as SyncthingClient);
    return client;
}

describe('serverStore', () => {
    beforeEach(() => {
        resetStore();
        vi.clearAllMocks();
    });

    afterEach(() => {
        resetStore();
    });

    describe('CRUD', () => {
        it('addServer adds a server and seeds default health', () => {
            mockClient();
            const id = useServerStore.getState().addServer({ name: 'A', url: 'http://a', apiKey: 'k' });

            const state = useServerStore.getState();
            expect(state.servers).toHaveLength(1);
            expect(state.servers[0].id).toBe(id);
            expect(state.health[id]).toMatchObject({ status: 'loading', config: null });
        });

        it('addServer generates unique ids', () => {
            mockClient();
            const id1 = useServerStore.getState().addServer({ name: 'A', url: 'http://a', apiKey: 'k' });
            const id2 = useServerStore.getState().addServer({ name: 'B', url: 'http://b', apiKey: 'k' });
            expect(id1).not.toBe(id2);
        });

        it('updateServer patches fields without touching the id', () => {
            mockClient();
            const id = useServerStore.getState().addServer({ name: 'A', url: 'http://a', apiKey: 'k' });
            useServerStore.getState().updateServer(id, { name: 'Renamed' });

            const srv = useServerStore.getState().servers.find((s) => s.id === id);
            expect(srv?.name).toBe('Renamed');
            expect(srv?.id).toBe(id);
        });

        it('removeServer removes the server and its health entry', () => {
            mockClient();
            const id = useServerStore.getState().addServer({ name: 'A', url: 'http://a', apiKey: 'k' });
            useServerStore.getState().removeServer(id);

            const state = useServerStore.getState();
            expect(state.servers).toHaveLength(0);
            expect(state.health[id]).toBeUndefined();
        });
    });

    describe('pollOnce', () => {
        it('sets status=online and stores fetched data on success', async () => {
            mockClient({
                getSystemStatus: vi.fn().mockResolvedValue({ myID: 'device-1' }),
            });
            const id = useServerStore.getState().addServer({ name: 'A', url: 'http://a', apiKey: 'k' });

            await useServerStore.getState().pollOnce(id);

            const health = useServerStore.getState().health[id];
            expect(health.status).toBe('online');
            expect(health.error).toBeNull();
            expect(health.systemStatus).toMatchObject({ myID: 'device-1' });
        });

        it('sets status=auth_error with advice message on SyncthingApiError(AUTH)', async () => {
            mockClient({
                getSystemStatus: vi.fn().mockRejectedValue(new SyncthingApiError('bad key', 'AUTH', 401)),
            });
            const id = useServerStore.getState().addServer({ name: 'A', url: 'http://a', apiKey: 'k' });

            await useServerStore.getState().pollOnce(id);

            const health = useServerStore.getState().health[id];
            expect(health.status).toBe('auth_error');
            expect(health.error).toMatch(/invalid api key/i);
        });

        it('sets status=offline on a generic OFFLINE error', async () => {
            mockClient({
                getSystemStatus: vi.fn().mockRejectedValue(new SyncthingApiError('down', 'OFFLINE', 502)),
            });
            const id = useServerStore.getState().addServer({ name: 'A', url: 'http://a', apiKey: 'k' });

            await useServerStore.getState().pollOnce(id);

            expect(useServerStore.getState().health[id].status).toBe('offline');
        });

        it('is a no-op for an id that does not exist', async () => {
            await expect(useServerStore.getState().pollOnce('nope')).resolves.toBeUndefined();
        });
    });

    describe('polling lifecycle', () => {
        it('startPolling schedules an interval and stopPolling clears it', () => {
            vi.useFakeTimers();
            mockClient();
            const id = useServerStore.getState().addServer({ name: 'A', url: 'http://a', apiKey: 'k' });
            useServerStore.getState().startPolling(id);

            expect(useServerStore.getState().pollingIntervals[id]).toBeDefined();

            useServerStore.getState().stopPolling(id);
            expect(useServerStore.getState().pollingIntervals[id]).toBeUndefined();
            vi.useRealTimers();
        });
    });

    describe('folder actions', () => {
        it('pauseAllFolders calls the client and re-polls', async () => {
            const client = mockClient();
            const id = useServerStore.getState().addServer({ name: 'A', url: 'http://a', apiKey: 'k' });
            // Seed a config so pauseAllFolders has something to act on.
            useServerStore.setState((s) => ({
                health: { ...s.health, [id]: { ...s.health[id], config: { folders: [], devices: [] } as never } },
            }));

            await useServerStore.getState().pauseAllFolders(id);

            expect(client.pauseAllFolders).toHaveBeenCalledTimes(1);
            expect(client.getSystemStatus).toHaveBeenCalled(); // re-poll happened
        });

        it('pauseAllFolders is a no-op when there is no config yet', async () => {
            const client = mockClient();
            const id = useServerStore.getState().addServer({ name: 'A', url: 'http://a', apiKey: 'k' });

            await useServerStore.getState().pauseAllFolders(id);

            expect(client.pauseAllFolders).not.toHaveBeenCalled();
        });
    });
});
