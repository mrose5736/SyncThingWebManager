import { useState } from 'react';
import {
    Settings as SettingsIcon,
    Server,
    Trash2,
    Pencil,
    Plus,
    Clock,
    ShieldAlert,
    Info,
    ExternalLink,
} from 'lucide-react';
import { useServerStore } from '@/store/serverStore';
import { ServerStatusBadge } from '@/components/ServerStatusBadge';
import { AddServerDialog } from '@/components/AddServerDialog';

const POLLING_OPTIONS = [
    { label: '3 seconds', value: 3000 },
    { label: '5 seconds', value: 5000 },
    { label: '10 seconds', value: 10000 },
    { label: '30 seconds', value: 30000 },
    { label: '1 minute', value: 60000 },
];

export function Settings() {
    const { servers, health, pollingMs, setPollingMs, removeServer } = useServerStore();
    const [addOpen, setAddOpen] = useState(false);
    const [editId, setEditId] = useState<string | undefined>();

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-700/50 bg-slate-900/70 backdrop-blur-xl px-6 py-4">
                <div className="flex items-center gap-3">
                    <SettingsIcon className="h-5 w-5 text-brand-400" />
                    <div>
                        <h1 className="text-sm font-bold text-slate-100">Settings</h1>
                        <p className="text-xs text-slate-400">Manage servers and application preferences</p>
                    </div>
                </div>
            </header>

            <div className="px-6 py-6 space-y-8 max-w-3xl">
                {/* ── Servers ── */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-200">Syncthing Servers</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {servers.length === 0
                                    ? 'No servers configured'
                                    : `${servers.length} server${servers.length !== 1 ? 's' : ''} configured`}
                            </p>
                        </div>
                        <button className="btn-primary text-xs" onClick={() => setAddOpen(true)}>
                            <Plus className="h-3.5 w-3.5" />
                            Add Server
                        </button>
                    </div>

                    {servers.length > 0 ? (
                        <div className="card overflow-hidden divide-y divide-slate-700/40">
                            {servers.map((srv) => {
                                const h = health[srv.id];
                                const status = h?.status ?? 'loading';
                                return (
                                    <div key={srv.id} className="flex items-center gap-4 px-4 py-3.5">
                                        <div className="rounded-lg bg-slate-700/40 p-2 shrink-0">
                                            <Server className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-200 truncate">
                                                {srv.name || srv.url}
                                            </p>
                                            <p className="text-xs font-mono text-slate-500 truncate">{srv.url}</p>
                                        </div>
                                        <ServerStatusBadge status={status} className="shrink-0" />
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                            <button
                                                className="btn-ghost p-1.5"
                                                title="Edit"
                                                onClick={() => setEditId(srv.id)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                className="btn-ghost p-1.5 text-red-400/60 hover:text-red-400"
                                                title="Remove"
                                                onClick={() => {
                                                    if (confirm(`Remove "${srv.name || srv.url}"?`)) removeServer(srv.id);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card px-4 py-8 text-center">
                            <Server className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-400">No servers yet. Add one to get started.</p>
                        </div>
                    )}
                </section>

                {/* ── Polling ── */}
                <section>
                    <h2 className="text-sm font-semibold text-slate-200 mb-1">Polling Interval</h2>
                    <p className="text-xs text-slate-400 mb-4">
                        How often Syncthing Central fetches metrics from each server.
                    </p>
                    <div className="card px-4 py-4">
                        <div className="flex items-center gap-3">
                            <Clock className="h-4 w-4 text-brand-400 shrink-0" />
                            <label className="text-sm text-slate-200 flex-1">Refresh every</label>
                            <select
                                className="input max-w-[160px]"
                                value={pollingMs}
                                onChange={(e) => setPollingMs(Number(e.target.value))}
                            >
                                {POLLING_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                {/* ── Security ── */}
                <section>
                    <h2 className="text-sm font-semibold text-slate-200 mb-1">Security</h2>
                    <p className="text-xs text-slate-400 mb-4">
                        How API keys are stored and handled.
                    </p>
                    <div className="card px-4 py-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-slate-200">LocalStorage</p>
                                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                    Server URLs and API keys are saved in your browser's{' '}
                                    <code className="text-slate-300 bg-slate-700/50 px-1 py-0.5 rounded text-[11px]">
                                        localStorage
                                    </code>
                                    . This is suitable for a self-hosted, single-user deployment. Do not use this
                                    app on a shared machine without understanding this.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── CORS guidance ── */}
                <section>
                    <h2 className="text-sm font-semibold text-slate-200 mb-1">CORS Configuration</h2>
                    <p className="text-xs text-slate-400 mb-4">
                        Required for browsers to connect to Syncthing's API.
                    </p>
                    <div className="card px-4 py-4 space-y-4">
                        <div className="flex items-start gap-3">
                            <Info className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="text-sm text-slate-200 font-medium">
                                    Enable Cross-Origin Requests in each Syncthing instance
                                </p>
                                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1 leading-relaxed">
                                    <li>
                                        Open your Syncthing GUI (e.g.{' '}
                                        <code className="text-slate-300 bg-slate-700/50 px-1 rounded text-[11px]">
                                            http://localhost:8384
                                        </code>
                                        )
                                    </li>
                                    <li>
                                        Go to <strong className="text-slate-300">Actions → Settings → GUI</strong>
                                    </li>
                                    <li>
                                        Enable <strong className="text-slate-300">Allow Cross-Origin Requests</strong>
                                    </li>
                                    <li>Click Save and restart Syncthing if prompted</li>
                                </ol>
                            </div>
                        </div>
                        <div className="border-t border-slate-700/40 pt-3">
                            <a
                                href="https://docs.syncthing.net/rest/config.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                            >
                                <ExternalLink className="h-3 w-3" />
                                Syncthing REST API documentation
                            </a>
                        </div>
                    </div>
                </section>

                {/* ── About ── */}
                <section>
                    <div className="card px-4 py-4 text-center text-xs text-slate-500">
                        <p className="font-semibold text-slate-300 mb-1">Syncthing Central</p>
                        <p>v1.0.0 · Open source · Built with React, TypeScript &amp; Tailwind CSS</p>
                    </div>
                </section>
            </div>

            <AddServerDialog open={addOpen} onClose={() => setAddOpen(false)} />
            {editId && (
                <AddServerDialog
                    open={!!editId}
                    onClose={() => setEditId(undefined)}
                    editId={editId}
                />
            )}
        </div>
    );
}
