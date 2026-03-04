import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Cpu,
    MemoryStick,
    FolderSync,
    Server,
    PauseCircle,
    PlayCircle,
    ScanSearch,
    ExternalLink,
    RefreshCw,
    Pencil,
    Trash2,
    Clock,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { cn, formatBytes, formatUptime, calcOverallSyncPercent } from '@/lib/utils';
import { useServerStore } from '@/store/serverStore';
import { ServerStatusBadge } from './ServerStatusBadge';
import { AddServerDialog } from './AddServerDialog';
import type { ServerConfig } from '@/types/syncthing';

interface Props {
    server: ServerConfig;
}

export function ServerCard({ server }: Props) {
    const { health, pauseAllFolders, resumeAllFolders, rescanAll, removeServer, pollOnce } =
        useServerStore();
    const h = health[server.id];
    const navigate = useNavigate();

    const [editOpen, setEditOpen] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    const status = h?.status ?? 'loading';
    const sys = h?.systemStatus;
    const cfg = h?.config;
    const conns = h?.connections;

    const cpuPercent = sys?.cpuPercent ?? 0;
    const ramMB = sys ? Math.round(sys.alloc / 1_048_576) : 0;
    const sysMB = sys ? Math.round(sys.sys / 1_048_576) : 0;
    const uptime = sys?.uptime ?? 0;
    const folderCount = cfg?.folders?.length ?? 0;
    const deviceCount = cfg?.devices?.length ?? 0;
    const onlineDevices = conns
        ? Object.values(conns.connections).filter((c) => c.connected).length
        : 0;

    const syncPercent = h?.folderStats
        ? calcOverallSyncPercent(h.folderStats)
        : 0;

    // Compute per-folder paused state for badge
    const allPaused =
        cfg?.folders && cfg.folders.length > 0 && cfg.folders.every((f) => f.paused);

    const run = async (label: string, action: () => Promise<void>) => {
        setBusy(label);
        try {
            await action();
        } finally {
            setBusy(null);
        }
    };

    // Determine sync bar color
    const syncColor =
        syncPercent === 100
            ? 'bg-emerald-500'
            : syncPercent > 50
                ? 'bg-brand-500'
                : 'bg-amber-500';

    // CPU bar color
    const cpuColor = cpuPercent > 80 ? 'bg-red-500' : cpuPercent > 50 ? 'bg-amber-500' : 'bg-brand-500';

    return (
        <>
            <div
                className={cn(
                    'card card-hover flex flex-col gap-0 overflow-hidden animate-fade-in',
                    status === 'offline' && 'opacity-80',
                )}
            >
                {/* ── Header ── */}
                <div className="flex items-start justify-between px-4 py-3.5 border-b border-slate-700/40">
                    <div className="flex items-start gap-3 min-w-0">
                        <div
                            className={cn(
                                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                                status === 'online'
                                    ? 'bg-brand-600/20'
                                    : status === 'offline'
                                        ? 'bg-slate-700/50'
                                        : 'bg-amber-600/20',
                            )}
                        >
                            <Server
                                className={cn(
                                    'h-4 w-4',
                                    status === 'online' ? 'text-brand-400' : 'text-slate-500',
                                )}
                            />
                        </div>
                        <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-slate-100">
                                {server.name || server.url}
                            </h3>
                            <p className="truncate text-[10px] font-mono text-slate-500 mt-0.5">
                                {server.url}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                        <ServerStatusBadge status={status} />
                    </div>
                </div>

                {/* ── Metrics grid ── */}
                {status === 'online' && sys ? (
                    <div className="grid grid-cols-3 divide-x divide-slate-700/40 border-b border-slate-700/40">
                        {/* CPU */}
                        <div className="px-4 py-3 flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                                <Cpu className="h-3 w-3 text-slate-400" />
                                <span className="metric-label">CPU</span>
                            </div>
                            <span className="metric-value text-xl text-slate-100">
                                {cpuPercent.toFixed(1)}
                                <span className="text-xs text-slate-400 ml-0.5">%</span>
                            </span>
                            <div className="progress-track">
                                <div
                                    className={cn('progress-fill', cpuColor)}
                                    style={{ width: `${Math.min(cpuPercent, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* RAM */}
                        <div className="px-4 py-3 flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                                <MemoryStick className="h-3 w-3 text-slate-400" />
                                <span className="metric-label">RAM</span>
                            </div>
                            <span className="metric-value text-xl text-slate-100">
                                {ramMB}
                                <span className="text-xs text-slate-400 ml-0.5">MB</span>
                            </span>
                            <div className="progress-track">
                                <div
                                    className="progress-fill bg-violet-500"
                                    style={{ width: `${Math.min((ramMB / sysMB) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Sync */}
                        <div className="px-4 py-3 flex flex-col gap-2">
                            <div className="flex items-center gap-1.5">
                                <FolderSync className="h-3 w-3 text-slate-400" />
                                <span className="metric-label">Sync</span>
                            </div>
                            <span className="metric-value text-xl text-slate-100">
                                {syncPercent.toFixed(0)}
                                <span className="text-xs text-slate-400 ml-0.5">%</span>
                            </span>
                            <div className="progress-track">
                                <div
                                    className={cn('progress-fill', syncColor)}
                                    style={{ width: `${syncPercent}%` }}
                                />
                            </div>
                        </div>
                    </div>
                ) : status === 'offline' || status === 'auth_error' ? (
                    /* Error state */
                    <div className="px-4 py-5 flex items-start gap-3">
                        <div className="rounded-lg bg-red-900/30 p-2 shrink-0 mt-0.5">
                            <Server className="h-4 w-4 text-red-400" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-red-300">
                                {status === 'auth_error' ? 'Authentication Failed' : 'Server Unreachable'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                {h?.error ?? 'Unable to connect. Check the URL and ensure Syncthing is running.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Loading skeleton */
                    <div className="px-4 py-5 flex items-center gap-3">
                        <RefreshCw className="h-4 w-4 text-slate-500 animate-spin" />
                        <span className="text-xs text-slate-400">Connecting to server…</span>
                    </div>
                )}

                {/* ── Info row ── */}
                {status === 'online' && (
                    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-slate-700/40 text-xs text-slate-400">
                        <span>{folderCount} folders</span>
                        <span className="text-slate-600">·</span>
                        <span>
                            {onlineDevices}/{deviceCount} devices
                        </span>
                        {uptime > 0 && (
                            <>
                                <span className="text-slate-600">·</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    up {formatUptime(uptime)}
                                </span>
                            </>
                        )}
                        {allPaused && (
                            <>
                                <span className="text-slate-600">·</span>
                                <span className="text-amber-400">⏸ All folders paused</span>
                            </>
                        )}
                    </div>
                )}

                {/* ── Folder expand ── */}
                {status === 'online' && folderCount > 0 && (
                    <div>
                        <button
                            className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/20 transition-colors"
                            onClick={() => setExpanded((v) => !v)}
                        >
                            <span className="font-medium">Folders</span>
                            {expanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                            )}
                        </button>

                        {expanded && (
                            <div className="px-4 pb-3 space-y-1.5 border-b border-slate-700/40">
                                {cfg?.folders.map((folder) => {
                                    const fs = h?.folderStats[folder.id];
                                    const pct = fs ? calcOverallSyncPercent({ [folder.id]: fs }) : 0;
                                    return (
                                        <div
                                            key={folder.id}
                                            className="flex items-center gap-2 rounded-lg bg-slate-700/30 px-3 py-2"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-200 truncate">
                                                    {folder.label || folder.id}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex-1 progress-track">
                                                        <div
                                                            className={cn(
                                                                'progress-fill',
                                                                pct === 100 ? 'bg-emerald-500' : 'bg-brand-500',
                                                            )}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-mono w-8 text-right shrink-0">
                                                        {pct.toFixed(0)}%
                                                    </span>
                                                    {fs && (
                                                        <span className="text-[10px] text-slate-500">
                                                            {formatBytes(fs.globalBytes)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span
                                                className={cn(
                                                    'shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                                                    folder.paused
                                                        ? 'bg-amber-400/20 text-amber-300'
                                                        : fs?.state === 'syncing'
                                                            ? 'bg-brand-400/20 text-brand-300'
                                                            : 'bg-emerald-400/20 text-emerald-300',
                                                )}
                                            >
                                                {folder.paused ? 'Paused' : fs?.state ?? 'idle'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex flex-wrap gap-2 px-4 py-3">
                    <button
                        className="btn-secondary text-xs"
                        disabled={busy !== null || status !== 'online'}
                        onClick={() => run('pause', () => pauseAllFolders(server.id))}
                        title="Pause all folders on this server"
                    >
                        <PauseCircle className="h-3.5 w-3.5" />
                        {busy === 'pause' ? 'Pausing…' : 'Pause All'}
                    </button>

                    <button
                        className="btn-secondary text-xs"
                        disabled={busy !== null || status !== 'online'}
                        onClick={() => run('resume', () => resumeAllFolders(server.id))}
                        title="Resume all folders on this server"
                    >
                        <PlayCircle className="h-3.5 w-3.5 text-emerald-400" />
                        {busy === 'resume' ? 'Resuming…' : 'Resume All'}
                    </button>

                    <button
                        className="btn-secondary text-xs"
                        disabled={busy !== null || status !== 'online'}
                        onClick={() => run('rescan', () => rescanAll(server.id))}
                        title="Trigger rescan of all folders"
                    >
                        <ScanSearch className="h-3.5 w-3.5 text-brand-400" />
                        {busy === 'rescan' ? 'Scanning…' : 'Rescan'}
                    </button>

                    <div className="flex-1" />

                    <button
                        className="btn-ghost text-xs"
                        title="Refresh now"
                        onClick={() => void pollOnce(server.id)}
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>

                    <button
                        className="btn-ghost text-xs"
                        title="Open Syncthing GUI"
                        onClick={() => window.open(server.url, '_blank')}
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </button>

                    <button
                        className="btn-ghost text-xs"
                        title="View details"
                        onClick={() => navigate(`/server/${server.id}`)}
                    >
                        Details
                    </button>

                    <button
                        className="btn-ghost text-xs text-slate-500 hover:text-slate-300"
                        title="Edit server"
                        onClick={() => setEditOpen(true)}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>

                    <button
                        className="btn-ghost text-xs text-red-400/60 hover:text-red-400"
                        title="Remove server"
                        onClick={() => {
                            if (confirm(`Remove "${server.name || server.url}"?`)) removeServer(server.id);
                        }}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <AddServerDialog open={editOpen} onClose={() => setEditOpen(false)} editId={server.id} />
        </>
    );
}
