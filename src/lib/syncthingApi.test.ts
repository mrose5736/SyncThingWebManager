import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SyncthingClient } from './syncthingApi';
import { SyncthingApiError } from './apiError';
import type { SyncthingConfig } from '@/types/syncthing';

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
    });
}

describe('SyncthingClient', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('strips a trailing slash from the base URL when building requests', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
        const client = new SyncthingClient('http://host:8384/', 'key');
        await client.ping();

        const [, init] = fetchMock.mock.calls[0];
        const body = JSON.parse(init.body as string);
        expect(body.url).toBe('http://host:8384');
    });

    it('sends method, path, and apiKey through to the proxy', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ myID: 'abc' }));
        const client = new SyncthingClient('http://host:8384', 'my-key');
        await client.getSystemStatus();

        const [, init] = fetchMock.mock.calls[0];
        const body = JSON.parse(init.body as string);
        expect(body).toMatchObject({ path: '/rest/system/status', method: 'GET', apiKey: 'my-key' });
    });

    it('returns parsed JSON on success', async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({ myID: 'device-123' }));
        const client = new SyncthingClient('http://host:8384', 'key');
        const status = await client.getSystemStatus();
        expect(status.myID).toBe('device-123');
    });

    it('treats an empty response body as an empty object', async () => {
        fetchMock.mockResolvedValueOnce(new Response('', { status: 200 }));
        const client = new SyncthingClient('http://host:8384', 'key');
        await expect(client.rescanAll()).resolves.toBeUndefined();
    });

    it('throws OFFLINE when the proxy itself is unreachable', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
        const client = new SyncthingClient('http://host:8384', 'key');

        await expect(client.getSystemStatus()).rejects.toMatchObject({
            type: 'OFFLINE',
        });
    });

    it('throws OFFLINE (502) when the proxy cannot reach the upstream Syncthing instance', async () => {
        fetchMock.mockResolvedValueOnce(
            jsonResponse({ error: 'Upstream unreachable: connect ECONNREFUSED' }, 502),
        );
        const client = new SyncthingClient('http://host:8384', 'key');

        await expect(client.getSystemStatus()).rejects.toMatchObject({
            type: 'OFFLINE',
            statusCode: 502,
        });
    });

    it.each([401, 403])('throws AUTH on HTTP %i', async (status) => {
        fetchMock.mockResolvedValueOnce(jsonResponse({}, status));
        const client = new SyncthingClient('http://host:8384', 'key');

        await expect(client.getSystemStatus()).rejects.toMatchObject({
            type: 'AUTH',
            statusCode: status,
        });
    });

    it('throws UNKNOWN for other non-ok statuses', async () => {
        fetchMock.mockResolvedValueOnce(new Response('server exploded', { status: 500 }));
        const client = new SyncthingClient('http://host:8384', 'key');

        await expect(client.getSystemStatus()).rejects.toMatchObject({
            type: 'UNKNOWN',
            statusCode: 500,
        });
    });

    it('throws when asked to pause a folder that does not exist in the config', async () => {
        const client = new SyncthingClient('http://host:8384', 'key');
        const config = { folders: [] } as unknown as SyncthingConfig;

        await expect(client.pauseFolder('missing-folder', config)).rejects.toBeInstanceOf(
            SyncthingApiError,
        );
    });

    it('pauses a folder by PUTing the full folder config with paused=true', async () => {
        fetchMock.mockResolvedValueOnce(new Response('', { status: 200 }));
        const client = new SyncthingClient('http://host:8384', 'key');
        const folder = { id: 'photos', paused: false, label: 'Photos' } as unknown as SyncthingConfig['folders'][number];
        const config = { folders: [folder] } as unknown as SyncthingConfig;

        await client.pauseFolder('photos', config);

        const [, init] = fetchMock.mock.calls[0];
        const body = JSON.parse(init.body as string);
        expect(body.method).toBe('PUT');
        expect(body.path).toBe('/rest/config/folders/photos');
        expect(body.body.paused).toBe(true);
    });
});
