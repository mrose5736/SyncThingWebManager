// ─── Syncthing REST API TypeScript Types ────────────────────────────────────

/** A user-configured Syncthing server connection */
export interface ServerConfig {
    id: string;
    name: string;
    url: string; // e.g. http://localhost:8384
    apiKey: string;
}

/** Runtime health state for a server (not persisted) */
export interface ServerHealth {
    status: 'online' | 'offline' | 'auth_error' | 'loading';
    lastPollAt: number | null;
    error: string | null;
    systemStatus: SystemStatus | null;
    connections: DeviceConnections | null;
    config: SyncthingConfig | null;
    folderStats: Record<string, FolderStats>;
}

// ─── /rest/system/status ────────────────────────────────────────────────────
export interface SystemStatus {
    alloc: number;        // bytes allocated by Go runtime (RAM)
    cpuPercent: number;   // CPU usage percent
    goroutines: number;
    myID: string;         // local device ID
    sys: number;          // total memory obtained from OS (bytes)
    uptime: number;       // seconds
    startTime: string;    // ISO 8601
    tilde: string;        // home directory
    pathSeparator: string;
    guiAddressOverridden: boolean;
    guiAddressUsed: string;
}

// ─── /rest/db/status ────────────────────────────────────────────────────────
export interface FolderStats {
    globalBytes: number;
    globalDeleted: number;
    globalDirectories: number;
    globalFiles: number;
    globalSymlinks: number;
    globalTotalItems: number;
    inSyncBytes: number;
    inSyncFiles: number;
    localBytes: number;
    localDeleted: number;
    localDirectories: number;
    localFiles: number;
    localSymlinks: number;
    localTotalItems: number;
    needBytes: number;
    needDeletes: number;
    needDirectories: number;
    needFiles: number;
    needSymlinks: number;
    needTotalItems: number;
    pullErrors: number;
    receiveOnlyChanged: number;
    sequence: number;
    state: FolderState;
    stateChanged: string;
    errors: number;
    version: number;
}

export type FolderState =
    | 'idle'
    | 'scanning'
    | 'sync-preparing'
    | 'syncing'
    | 'error'
    | 'stopped'
    | 'unknown';

// ─── /rest/config ────────────────────────────────────────────────────────────
export interface SyncthingConfig {
    version: number;
    folders: ConfigFolder[];
    devices: ConfigDevice[];
    gui: GUIConfig;
    options: SyncthingOptions;
}

export interface ConfigFolder {
    id: string;
    label: string;
    path: string;
    type: 'sendreceive' | 'sendonly' | 'receiveonly' | 'receiveencrypted';
    devices: FolderDevice[];
    paused: boolean;
    scanIntervalS: number;
    minDiskFree: { value: number; unit: string };
    versioning: { type: string; params: Record<string, string> };
    copiers: number;
    pullerMaxPendingKiB: number;
    rescanIntervalS: number;
    fsWatcherEnabled: boolean;
    fsWatcherDelayS: number;
    ignorePerms: boolean;
    autoNormalize: boolean;
}

export interface FolderDevice {
    deviceID: string;
    introducedBy: string;
    encryptionPassword: string;
}

export interface ConfigDevice {
    deviceID: string;
    name: string;
    addresses: string[];
    compression: string;
    certName: string;
    introducer: boolean;
    skipIntroductionRemovals: boolean;
    introducedBy: string;
    paused: boolean;
    allowedNetworks: string[];
    autoAcceptFolders: boolean;
    maxSendKbps: number;
    maxRecvKbps: number;
    ignoredFolders: unknown[];
    maxRequestKiB: number;
    untrusted: boolean;
    remoteGUIPort: number;
}

export interface GUIConfig {
    enabled: boolean;
    address: string;
    authMode: string;
    useTLS: boolean;
    debugging: boolean;
}

export interface SyncthingOptions {
    listenAddresses: string[];
    globalAnnounceEnabled: boolean;
    localAnnounceEnabled: boolean;
    relaysEnabled: boolean;
    maxSendKbps: number;
    maxRecvKbps: number;
    reconnectionIntervalS: number;
    relayReconnectIntervalM: number;
    startBrowser: boolean;
    natEnabled: boolean;
    natLeaseMinutes: number;
    natRenewalMinutes: number;
    natTimeoutSeconds: number;
    urAccepted: number;
    urSeen: number;
    urUniqueId: string;
    urURL: string;
    urPostInsecurely: boolean;
    urInitialDelayS: number;
    restartOnWakeup: boolean;
    autoUpgradeIntervalH: number;
    upgradeToPreReleases: boolean;
    keepTemporariesH: number;
    cacheIgnoredFiles: boolean;
    progressUpdateIntervalS: number;
    limitBandwidthInLan: boolean;
    minHomeDiskFree: { value: number; unit: string };
    releasesURL: string;
    overwriteRemoteDeviceNamesOnConnect: boolean;
    tempIndexMinBlocks: number;
    unackedNotificationIDs: string[];
    trafficClass: number;
    setLowPriority: boolean;
    maxFolderConcurrency: number;
    crUrl: string;
    crashReportingEnabled: boolean;
    stunKeepaliveStartS: number;
    stunKeepaliveMinS: number;
    stunServers: string[];
    databaseTuning: string;
    maxConcurrentIncomingRequestKiB: number;
    announceLANAddresses: boolean;
    sendFullIndexOnUpgrade: boolean;
    connectionPriorityTcpLan: number;
    connectionPriorityQuicLan: number;
    connectionPriorityTcpWan: number;
    connectionPriorityQuicWan: number;
    connectionPriorityRelay: number;
    connectionPriorityUpgradeThreshold: number;
}

// ─── /rest/system/connections ────────────────────────────────────────────────
export interface DeviceConnections {
    connections: Record<string, DeviceConnection>;
    total: TotalConnectionStats;
}

export interface DeviceConnection {
    at: string;
    inBytesTotal: number;
    outBytesTotal: number;
    address: string;
    type: string;
    isLocal: boolean;
    crypto: string;
    connected: boolean;
    paused: boolean;
    clientVersion: string;
}

export interface TotalConnectionStats {
    at: string;
    inBytesTotal: number;
    outBytesTotal: number;
}

// ─── UI / App types ──────────────────────────────────────────────────────────

/** Derived sync progress for a folder (0–100) */
export interface FolderSyncProgress {
    folderId: string;
    label: string;
    percent: number;
    state: FolderState;
    paused: boolean;
    needBytes: number;
    globalBytes: number;
}

/** Aggregated summary for a server card */
export interface ServerSummary {
    serverId: string;
    cpuPercent: number;
    ramMB: number;
    syncPercent: number; // 0–100
    folderCount: number;
    deviceCount: number;
    onlineDevices: number;
    uptime: number;
    myID: string;
}
