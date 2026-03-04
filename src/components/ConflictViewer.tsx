import { AlertTriangle, FileX2, Copy, CheckCheck } from 'lucide-react';
import { useState } from 'react';
import { useServerStore } from '@/store/serverStore';
import { cn } from '@/lib/utils';



/**
 * ConflictViewer scans folderStats for files containing ".sync-conflict" patterns
 * from the server config. Since Syncthing doesn't expose a dedicated conflicts API,
 * we detect conflicts via the FolderStats.errors > 0 flag and guide the user.
 */
export function ConflictViewer() {
    const { servers, health } = useServerStore();

    // Build list of servers with folder errors
    const conflictServers = servers.flatMap((srv) => {
        const h = health[srv.id];
        if (!h?.folderStats || h.status !== 'online') return [];

        const errorFolders = Object.entries(h.folderStats)
            .filter(([, stats]) => stats.pullErrors > 0 || stats.errors > 0)
            .map(([folderId]) => {
                const folder = h.config?.folders.find((f) => f.id === folderId);
                return {
                    folderId,
                    label: folder?.label ?? folderId,
                    path: folder?.path ?? '',
                    pullErrors: h.folderStats[folderId]?.pullErrors ?? 0,
                    errors: h.folderStats[folderId]?.errors ?? 0,
                };
            });

        if (errorFolders.length === 0) return [];
        return [{ server: srv, folders: errorFolders }];
    });

    if (conflictServers.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
                <CheckCheck className="h-8 w-8 text-emerald-500/60" />
                <p className="text-sm">No conflicts or errors detected across all servers.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {conflictServers.map(({ server, folders }) => (
                <div key={server.id} className="card overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/40 bg-amber-500/5">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-300">{server.name || server.url}</span>
                        <span className="ml-auto text-xs text-slate-400">
                            {folders.length} folder{folders.length !== 1 ? 's' : ''} with errors
                        </span>
                    </div>

                    <div className="divide-y divide-slate-700/30">
                        {folders.map((f) => (
                            <ConflictRow
                                key={f.folderId}
                                label={f.label}
                                path={f.path}
                                pullErrors={f.pullErrors}
                                errors={f.errors}
                            />
                        ))}
                    </div>

                    <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/40">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            <span className="text-amber-300 font-medium">Tip:</span> Open the Syncthing GUI for{' '}
                            <strong className="text-slate-200">{server.name}</strong> to resolve individual file
                            conflicts under <em>Folders → Show Errors</em>.
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ConflictRow({
    label,
    path,
    pullErrors,
    errors,
}: {
    label: string;
    path: string;
    pullErrors: number;
    errors: number;
}) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(path);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <FileX2 className="h-4 w-4 text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{label}</p>
                <p className="text-xs font-mono text-slate-500 truncate">{path || '—'}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                {pullErrors > 0 && (
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] text-red-300">
                        {pullErrors} pull error{pullErrors !== 1 ? 's' : ''}
                    </span>
                )}
                {errors > 0 && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">
                        {errors} error{errors !== 1 ? 's' : ''}
                    </span>
                )}
                {path && (
                    <button
                        className={cn(
                            'btn-ghost text-xs p-1.5',
                            copied ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300',
                        )}
                        onClick={() => void copy()}
                        title="Copy folder path"
                    >
                        {copied ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                )}
            </div>
        </div>
    );
}
