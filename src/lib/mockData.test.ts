import { describe, it, expect } from 'vitest';
import { getMockResponse, applyMockFolderUpdate } from './mockData';
import { SyncthingApiError } from './apiError';
import type { SystemStatus, SyncthingConfig, FolderStats, DeviceConnections, ConfigFolder } from '@/types/syncthing';

describe('getMockResponse', () => {
    it('returns system status with a deterministic-shaped payload', () => {
        const status = getMockResponse<SystemStatus>('http://demo-a', '/rest/system/status', 'GET');
        expect(status.myID).toMatch(/^DEMO/);
        expect(status.uptime).toBeGreaterThan(0);
        expect(typeof status.cpuPercent).toBe('number');
    });

    it('returns config with three seeded folders', () => {
        const config = getMockResponse<SyncthingConfig>('http://demo-b', '/rest/config', 'GET');
        expect(config.folders).toHaveLength(3);
        expect(config.folders.map((f) => f.id)).toEqual(['photos', 'docs', 'projects']);
    });

    it('returns folder stats scoped by folder id in the query string', () => {
        const stats = getMockResponse<FolderStats>(
            'http://demo-c',
            '/rest/db/status?folder=photos',
            'GET',
        );
        expect(stats.globalBytes).toBeGreaterThan(0);
        expect(stats.state).toMatch(/idle|syncing|stopped/);
    });

    it('returns connections with a connected demo device', () => {
        const conns = getMockResponse<DeviceConnections>('http://demo-d', '/rest/system/connections', 'GET');
        expect(conns.connections['DEMO-DEVICE-1'].connected).toBe(true);
    });

    it('keeps per-instance state isolated by baseUrl', () => {
        const a = getMockResponse<SystemStatus>('http://demo-e', '/rest/system/status', 'GET');
        const b = getMockResponse<SystemStatus>('http://demo-f', '/rest/system/status', 'GET');
        expect(a.myID).not.toBe(b.myID);
    });

    it('returns the same instance state on repeated calls for the same baseUrl', () => {
        const first = getMockResponse<SystemStatus>('http://demo-g', '/rest/system/status', 'GET');
        const second = getMockResponse<SystemStatus>('http://demo-g', '/rest/system/status', 'GET');
        expect(first.myID).toBe(second.myID);
    });

    it('throws SyncthingApiError for an unmocked path', () => {
        expect(() => getMockResponse('http://demo-h', '/rest/unknown/thing', 'GET')).toThrow(
            SyncthingApiError,
        );
    });
});

describe('applyMockFolderUpdate', () => {
    it('persists a folder pause state and reflects it in subsequent config reads', () => {
        const baseUrl = 'http://demo-pause';
        const config = getMockResponse<SyncthingConfig>(baseUrl, '/rest/config', 'GET');
        const folder = config.folders.find((f) => f.id === 'photos') as ConfigFolder;

        applyMockFolderUpdate(baseUrl, { ...folder, paused: true });

        const updated = getMockResponse<SyncthingConfig>(baseUrl, '/rest/config', 'GET');
        expect(updated.folders.find((f) => f.id === 'photos')?.paused).toBe(true);
    });

    it('reports paused folders as stopped in folder stats', () => {
        const baseUrl = 'http://demo-stopped';
        const config = getMockResponse<SyncthingConfig>(baseUrl, '/rest/config', 'GET');
        const folder = config.folders.find((f) => f.id === 'docs') as ConfigFolder;
        applyMockFolderUpdate(baseUrl, { ...folder, paused: true });

        const stats = getMockResponse<FolderStats>(baseUrl, '/rest/db/status?folder=docs', 'GET');
        expect(stats.state).toBe('stopped');
    });
});
