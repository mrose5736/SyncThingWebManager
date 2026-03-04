import { useState } from 'react';
import { ServerCrash, Plus, AlertCircle } from 'lucide-react';
import { useServerStore } from '@/store/serverStore';
import { ServerCard } from '@/components/ServerCard';
import { GlobalActionBar } from '@/components/GlobalActionBar';
import { AddServerDialog } from '@/components/AddServerDialog';
import { ConflictViewer } from '@/components/ConflictViewer';

export function Dashboard() {
    const { servers, health } = useServerStore();
    const [addOpen, setAddOpen] = useState(false);
    const [showConflicts, setShowConflicts] = useState(false);

    // Count servers with errors
    const errorCount = servers.filter(
        (s) => health[s.id]?.status === 'offline' || health[s.id]?.status === 'auth_error',
    ).length;

    const conflictCount = servers.reduce((acc, s) => {
        const stats = health[s.id]?.folderStats ?? {};
        return acc + Object.values(stats).filter((f) => f.errors > 0 || f.pullErrors > 0).length;
    }, 0);

    return (
        <div className="flex flex-col min-h-screen">
            {/* ── Top header ── */}
            <header className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold text-slate-100">Dashboard</h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {servers.length === 0
                                ? 'No servers configured yet'
                                : `Monitoring ${servers.length} server${servers.length !== 1 ? 's' : ''}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Conflict alert */}
                        {conflictCount > 0 && (
                            <button
                                className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300 hover:bg-amber-500/20 transition-colors"
                                onClick={() => setShowConflicts((v) => !v)}
                            >
                                <AlertCircle className="h-3.5 w-3.5" />
                                {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
                            </button>
                        )}

                        {/* Error badge */}
                        {errorCount > 0 && (
                            <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300">
                                <ServerCrash className="h-3.5 w-3.5" />
                                {errorCount} offline
                            </span>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 px-6 py-5 space-y-5">
                {/* Global action bar */}
                <GlobalActionBar />

                {/* Conflict panel */}
                {showConflicts && (
                    <div className="animate-slide-up">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-amber-300">Conflicts & Errors</h2>
                            <button
                                className="btn-ghost text-xs"
                                onClick={() => setShowConflicts(false)}
                            >
                                Hide
                            </button>
                        </div>
                        <ConflictViewer />
                    </div>
                )}

                {/* Server grid or empty state */}
                {servers.length === 0 ? (
                    <EmptyState onAdd={() => setAddOpen(true)} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {servers.map((srv) => (
                            <ServerCard key={srv.id} server={srv} />
                        ))}
                    </div>
                )}
            </div>

            <AddServerDialog open={addOpen} onClose={() => setAddOpen(false)} />
        </div>
    );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-fade-in">
            <div className="relative mb-6">
                <div className="absolute inset-0 rounded-3xl bg-brand-500/10 blur-2xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-700/60 bg-slate-800/60 shadow-2xl">
                    <ServerCrash className="h-10 w-10 text-slate-500" />
                </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">No servers configured</h2>
            <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
                Add your first Syncthing instance to start monitoring. You'll need the server URL and
                its API key from the Syncthing GUI.
            </p>
            <button className="btn-primary" onClick={onAdd}>
                <Plus className="h-4 w-4" />
                Add Your First Server
            </button>
        </div>
    );
}
