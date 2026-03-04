import { useState } from 'react';
import {
    PauseCircle,
    PlayCircle,
    ScanSearch,
    Plus,
    ServerCrash,
    CheckCircle2,
    Wifi,
} from 'lucide-react';
import { useServerStore } from '@/store/serverStore';
import { AddServerDialog } from './AddServerDialog';

export function GlobalActionBar() {
    const { servers, health, pauseAllFolders, resumeAllFolders, rescanAll } = useServerStore();
    const [addOpen, setAddOpen] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);

    const online = servers.filter((s) => health[s.id]?.status === 'online');
    const totalFolders = servers.reduce(
        (acc, s) => acc + (health[s.id]?.config?.folders?.length ?? 0),
        0,
    );

    const run = async (label: string, action: () => Promise<void>) => {
        setBusy(label);
        try {
            await action();
        } finally {
            setBusy(null);
        }
    };

    const handlePauseAll = () =>
        run('pause', async () => {
            await Promise.allSettled(online.map((s) => pauseAllFolders(s.id)));
        });

    const handleResumeAll = () =>
        run('resume', async () => {
            await Promise.allSettled(online.map((s) => resumeAllFolders(s.id)));
        });

    const handleRescanAll = () =>
        run('rescan', async () => {
            await Promise.allSettled(online.map((s) => rescanAll(s.id)));
        });

    return (
        <>
            <div className="card border-slate-700/40 px-4 py-3 flex flex-wrap items-center gap-3">
                {/* Stats */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-brand-400" />
                        <span className="text-sm font-medium text-slate-200">
                            <span className="text-brand-400">{online.length}</span>
                            <span className="text-slate-500"> / </span>
                            <span>{servers.length}</span>
                            <span className="ml-1.5 text-slate-400">servers online</span>
                        </span>
                    </div>

                    {totalFolders > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            {totalFolders} folders tracked
                        </div>
                    )}
                </div>

                {/* Global actions */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        className="btn-secondary text-xs gap-1.5"
                        onClick={handlePauseAll}
                        disabled={online.length === 0 || busy !== null}
                        title="Pause all folders on all online servers"
                    >
                        <PauseCircle className="h-3.5 w-3.5" />
                        {busy === 'pause' ? 'Pausing…' : 'Pause All'}
                    </button>

                    <button
                        className="btn-secondary text-xs gap-1.5"
                        onClick={handleResumeAll}
                        disabled={online.length === 0 || busy !== null}
                        title="Resume all folders on all online servers"
                    >
                        <PlayCircle className="h-3.5 w-3.5 text-emerald-400" />
                        {busy === 'resume' ? 'Resuming…' : 'Resume All'}
                    </button>

                    <button
                        className="btn-secondary text-xs gap-1.5"
                        onClick={handleRescanAll}
                        disabled={online.length === 0 || busy !== null}
                        title="Trigger a rescan on all online servers"
                    >
                        <ScanSearch className="h-3.5 w-3.5 text-brand-400" />
                        {busy === 'rescan' ? 'Scanning…' : 'Rescan All'}
                    </button>

                    {servers.length === 0 && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <ServerCrash className="h-3.5 w-3.5" />
                            No servers configured
                        </span>
                    )}

                    <button
                        className="btn-primary text-xs gap-1.5"
                        onClick={() => setAddOpen(true)}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Server
                    </button>
                </div>
            </div>

            <AddServerDialog open={addOpen} onClose={() => setAddOpen(false)} />
        </>
    );
}
