import type {
    SystemStatus,
    FolderStats,
    SyncthingConfig,
    ConfigFolder,
    DeviceConnections,
} from '@/types/syncthing';
import { SyncthingApiError } from './apiError';

/**
 * Deterministic-ish fake data used when DEMO_MODE is on, so the public demo
 * never needs a real Syncthing instance (or the proxy) at all. State is kept
 * per baseUrl so folder pause/resume feels persistent within a session.
 */

interface DemoInstance {
    config: SyncthingConfig;
    startTime: number;
    myID: string;
}

const instances = new Map<string, DemoInstance>();

function randomId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeFolder(id: string, label: string, path: string): ConfigFolder {
    return {
        id,
        label,
        path,
        type: 'sendreceive',
        devices: [],
        paused: false,
        scanIntervalS: 3600,
        minDiskFree: { value: 1, unit: '%' },
        versioning: { type: '', params: {} },
        copiers: 1,
        pullerMaxPendingKiB: 0,
        rescanIntervalS: 3600,
        fsWatcherEnabled: true,
        fsWatcherDelayS: 10,
        ignorePerms: false,
        autoNormalize: true,
    };
}

function getOrCreateInstance(baseUrl: string): DemoInstance {
    let inst = instances.get(baseUrl);
    if (!inst) {
        inst = {
            startTime: Date.now(),
            myID: 'DEMO' + randomId('ID').toUpperCase(),
            config: {
                version: 37,
                folders: [
                    makeFolder('photos', 'Photos', '/home/demo/Photos'),
                    makeFolder('docs', 'Documents', '/home/demo/Documents'),
                    makeFolder('projects', 'Projects', '/home/demo/Projects'),
                ],
                devices: [
                    {
                        deviceID: 'DEMO-DEVICE-1',
                        name: 'demo-phone',
                        addresses: ['dynamic'],
                        compression: 'metadata',
                        certName: '',
                        introducer: false,
                        skipIntroductionRemovals: false,
                        introducedBy: '',
                        paused: false,
                        allowedNetworks: [],
                        autoAcceptFolders: false,
                        maxSendKbps: 0,
                        maxRecvKbps: 0,
                        ignoredFolders: [],
                        maxRequestKiB: 0,
                        untrusted: false,
                        remoteGUIPort: 0,
                    },
                ],
                gui: { enabled: true, address: '0.0.0.0:8384', authMode: 'static', useTLS: false, debugging: false },
                options: {} as SyncthingConfig['options'],
            },
        };
        instances.set(baseUrl, inst);
    }
    return inst;
}

function mockSystemStatus(baseUrl: string): SystemStatus {
    const inst = getOrCreateInstance(baseUrl);
    const uptime = Math.floor((Date.now() - inst.startTime) / 1000) + 86_400 * 3;
    return {
        alloc: 45_000_000 + Math.floor(Math.random() * 5_000_000),
        cpuPercent: Math.round((2 + Math.random() * 6) * 10) / 10,
        goroutines: 42,
        myID: inst.myID,
        sys: 120_000_000,
        uptime,
        startTime: new Date(inst.startTime).toISOString(),
        tilde: '/home/demo',
        pathSeparator: '/',
        guiAddressOverridden: false,
        guiAddressUsed: '0.0.0.0:8384',
    };
}

function mockFolderStats(baseUrl: string, folderId: string): FolderStats {
    const inst = getOrCreateInstance(baseUrl);
    const folder = inst.config.folders.find((f) => f.id === folderId);
    const globalBytes = 2_500_000_000 + folderId.length * 100_000_000;
    const syncing = !folder?.paused && Math.random() < 0.15;
    const needBytes = syncing ? Math.floor(Math.random() * 50_000_000) : 0;

    return {
        globalBytes,
        globalDeleted: 12,
        globalDirectories: 340,
        globalFiles: 8_200,
        globalSymlinks: 0,
        globalTotalItems: 8_540,
        inSyncBytes: globalBytes - needBytes,
        inSyncFiles: 8_200,
        localBytes: globalBytes,
        localDeleted: 12,
        localDirectories: 340,
        localFiles: 8_200,
        localSymlinks: 0,
        localTotalItems: 8_540,
        needBytes,
        needDeletes: 0,
        needDirectories: 0,
        needFiles: needBytes > 0 ? Math.ceil(needBytes / 1_000_000) : 0,
        needSymlinks: 0,
        needTotalItems: needBytes > 0 ? Math.ceil(needBytes / 1_000_000) : 0,
        pullErrors: 0,
        receiveOnlyChanged: 0,
        sequence: 100_000,
        state: folder?.paused ? 'stopped' : syncing ? 'syncing' : 'idle',
        stateChanged: new Date().toISOString(),
        errors: 0,
        version: 37,
    };
}

function mockConnections(): DeviceConnections {
    return {
        connections: {
            'DEMO-DEVICE-1': {
                at: new Date().toISOString(),
                inBytesTotal: 1_200_000_000,
                outBytesTotal: 980_000_000,
                address: '192.168.1.42:22000',
                type: 'tcp-client',
                isLocal: true,
                crypto: 'TLS1.3',
                connected: true,
                paused: false,
                clientVersion: 'v1.27.0',
            },
        },
        total: {
            at: new Date().toISOString(),
            inBytesTotal: 1_200_000_000,
            outBytesTotal: 980_000_000,
        },
    };
}

/** Resolve a mocked response for a given proxied Syncthing REST path. */
export function getMockResponse<T>(baseUrl: string, path: string, method: string): T {
    const inst = getOrCreateInstance(baseUrl);

    if (path === '/rest/system/status') return mockSystemStatus(baseUrl) as unknown as T;
    if (path === '/rest/system/ping') return { ping: 'pong' } as unknown as T;
    if (path === '/rest/system/connections') return mockConnections() as unknown as T;
    if (path === '/rest/config') return inst.config as unknown as T;

    if (path.startsWith('/rest/db/status')) {
        const folderId = new URLSearchParams(path.split('?')[1] ?? '').get('folder') ?? '';
        return mockFolderStats(baseUrl, folderId) as unknown as T;
    }

    if (path.startsWith('/rest/config/folders/') && method === 'PUT') {
        return {} as unknown as T;
    }

    if (path.startsWith('/rest/db/scan')) return {} as unknown as T;
    if (path === '/rest/system/restart' || path === '/rest/system/shutdown') return {} as unknown as T;

    throw new SyncthingApiError(`Demo mode has no mock for ${path}`, 'UNKNOWN');
}

/** Apply a folder-config PUT (used for pause/resume) to the in-memory demo instance. */
export function applyMockFolderUpdate(baseUrl: string, folder: ConfigFolder): void {
    const inst = getOrCreateInstance(baseUrl);
    inst.config.folders = inst.config.folders.map((f) => (f.id === folder.id ? folder : f));
}
