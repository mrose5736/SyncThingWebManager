import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Server,
    Cpu,
    MemoryStick,
    FolderSync,
    Clock,
    Monitor,
    RefreshCw,
    ExternalLink,
} from 'lucide-react';
import { useServerStore } from '@/store/serverStore';
import { ServerStatusBadge } from '@/components/ServerStatusBadge';
import { ConflictViewer } from '@/components/ConflictViewer';
import { cn, formatBytes, formatUptime, calcOverallSyncPercent } from '@/lib/utils';

export function ServerDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { servers, health, pollOnce, pauseAllFolders, resumeAllFolders, rescanAll } =
        useServerStore();

    const server = servers.find((s) => s.id === id);
    const h = id ? health[id] : undefined;

    if (!server) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-slate-400">
                <Server className="h-12 w-12 mb-4 opacity-40" />
                <p>Server not found.</p>
                <button className="btn-secondary mt-4" onClick={() => navigate('/')}>
                    ← Back to Dashboard
                </button>
            </div>
        );
    }

    const status = h?.status ?? 'loading';
    const sys = h?.systemStatus;
    const cfg = h?.config;
    const conns = h?.connections;

    const cpuPercent = sys?.cpuPercent ?? 0;
    const ramMB = sys ? Math.round(sys.alloc / 1_048_576) : 0;
    const syncPercent = h?.folderStats ? calcOverallSyncPercent(h.folderStats) : 0;



    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl px-6 py-4">
                <div className="flex items-center gap-4">
                    <button className="btn-ghost p-1.5" onClick={() => navigate('/')}>
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="rounded-lg bg-brand-600/20 p-2">
                            <Server className="h-4 w-4 text-brand-400" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-slate-100 truncate">
                                {server.name || server.url}
                            </h1>
                            <p className="text-xs font-mono text-slate-500 truncate">{server.url}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <ServerStatusBadge status={status} />
                        <button
                            className="btn-ghost text-xs"
                            onClick={() => server.id && void pollOnce(server.id)}
                            title="Refresh now"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button
                            className="btn-secondary text-xs"
                            onClick={() => window.open(server.url, '_blank')}
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Open GUI
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-6 py-6 space-y-6 max-w-5xl">
                {/* ── System overview ── */}
                <section>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                        System Overview
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            {
                                icon: Cpu,
                                label: 'CPU',
                                value: `${cpuPercent.toFixed(1)}%`,
                                color: cpuPercent > 80 ? 'text-red-400' : 'text-brand-400',
                            },
                            {
                                icon: MemoryStick,
                                label: 'RAM (alloc)',
                                value: `${ramMB} MB`,
                                color: 'text-violet-400',
                            },
                            {
                                icon: FolderSync,
                                label: 'Sync Progress',
                                value: `${syncPercent.toFixed(0)}%`,
                                color: syncPercent === 100 ? 'text-emerald-400' : 'text-amber-400',
                            },
                            {
                                icon: Clock,
                                label: 'Uptime',
                                value: sys ? formatUptime(sys.uptime) : '—',
                                color: 'text-slate-300',
                            },
                        ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className="card px-4 py-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="metric-label">{label}</span>
                                </div>
                                <span className={cn('metric-value text-2xl', color)}>{value}</span>
                            </div>
                        ))}
                    </div>

                    {sys && (
                        <div className="mt-2 card px-4 py-3 flex flex-wrap gap-4 text-xs text-slate-400">
                            <span>
                                Device ID:{' '}
                                <span className="font-mono text-slate-300">{sys.myID.slice(0, 16)}…</span>
                            </span>
                            <span className="text-slate-600">·</span>
                            <span>
                                GUI Address:{' '}
                                <span className="font-mono text-slate-300">{sys.guiAddressUsed}</span>
                            </span>
                            <span className="text-slate-600">·</span>
                            <span>
                                Goroutines:{' '}
                                <span className="font-mono text-slate-300">{sys.goroutines}</span>
                            </span>
                        </div>
                    )}
                </section>

                {/* ── Folders ── */}
                {cfg && cfg.folders.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Folders ({cfg.folders.length})
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    className="btn-secondary text-xs"
                                    onClick={() => void pauseAllFolders(server.id)}
                                    disabled={status !== 'online'}
                                >
                                    Pause All
                                </button>
                                <button
                                    className="btn-secondary text-xs"
                                    onClick={() => void resumeAllFolders(server.id)}
                                    disabled={status !== 'online'}
                                >
                                    Resume All
                                </button>
                                <button
                                    className="btn-secondary text-xs"
                                    onClick={() => void rescanAll(server.id)}
                                    disabled={status !== 'online'}
                                >
                                    Rescan All
                                </button>
                            </div>
                        </div>

                        <div className="card overflow-hidden">
                            <div className="divide-y divide-slate-700/40">
                                {cfg.folders.map((folder) => {
                                    const fs = h?.folderStats[folder.id];
                                    const pct = fs ? calcOverallSyncPercent({ [folder.id]: fs }) : 0;
                                    return (
                                        <div key={folder.id} className="px-4 py-3 flex items-center gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-medium text-slate-200 truncate">
                                                        {folder.label || folder.id}
                                                    </p>
                                                    <span
                                                        className={cn(
                                                            'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                                                            folder.paused
                                                                ? 'bg-amber-400/20 text-amber-300'
                                                                : fs?.state === 'syncing'
                                                                    ? 'bg-brand-400/20 text-brand-300'
                                                                    : 'bg-emerald-400/20 text-emerald-300',
                                                        )}
                                                    >
                                                        {folder.paused ? 'Paused' : fs?.state ?? 'idle'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                                                        {folder.type}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-mono text-slate-500 truncate mb-1.5">
                                                    {folder.path}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 progress-track">
                                                        <div
                                                            className={cn(
                                                                'progress-fill',
                                                                pct === 100 ? 'bg-emerald-500' : 'bg-brand-500',
                                                            )}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-mono text-slate-400 w-10 text-right shrink-0">
                                                        {pct.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                            {fs && (
                                                <div className="shrink-0 text-right text-xs text-slate-400 space-y-0.5">
                                                    <p>{formatBytes(fs.globalBytes)}</p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {fs.globalFiles} files
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Connected devices ── */}
                {cfg && cfg.devices.length > 0 && (
                    <section>
                        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                            Devices ({cfg.devices.length})
                        </h2>
                        <div className="card overflow-hidden">
                            <div className="divide-y divide-slate-700/40">
                                {cfg.devices.map((device) => {
                                    const conn = conns?.connections[device.deviceID];
                                    const connected = conn?.connected ?? false;
                                    return (
                                        <div key={device.deviceID} className="px-4 py-3 flex items-center gap-4">
                                            <span
                                                className={cn(
                                                    'status-dot shrink-0',
                                                    connected ? 'status-dot-online' : 'status-dot-offline',
                                                )}
                                            />
                                            <Monitor className="h-4 w-4 text-slate-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate">
                                                    {device.name || 'Unnamed Device'}
                                                </p>
                                                <p className="text-[10px] font-mono text-slate-500 truncate">
                                                    {device.deviceID.slice(0, 24)}…
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs text-slate-300">{connected ? 'Connected' : 'Disconnected'}</p>
                                                {conn?.address && (
                                                    <p className="text-[10px] font-mono text-slate-500">{conn.address}</p>
                                                )}
                                                {conn && connected && (
                                                    <p className="text-[10px] text-slate-500">
                                                        ↓ {formatBytes(conn.inBytesTotal)} ↑ {formatBytes(conn.outBytesTotal)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Conflicts ── */}
                <section>
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                        Conflicts & Errors
                    </h2>
                    <ConflictViewer />
                </section>
            </div>
        </div>
    );
}
