import { useState } from 'react';
import { X, Server, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SyncthingClient } from '@/lib/syncthingApi';
import { SyncthingApiError } from '@/lib/apiError';
import { useServerStore } from '@/store/serverStore';

interface Props {
    open: boolean;
    onClose: () => void;
    /** If provided, edit mode for that server ID */
    editId?: string;
}

type TestState = 'idle' | 'testing' | 'ok' | 'error';

export function AddServerDialog({ open, onClose, editId }: Props) {
    const { servers, addServer, updateServer } = useServerStore();
    const existing = editId ? servers.find((s) => s.id === editId) : undefined;

    const [name, setName] = useState(existing?.name ?? '');
    const [url, setUrl] = useState(existing?.url ?? 'http://');
    const [apiKey, setApiKey] = useState(existing?.apiKey ?? '');
    const [showKey, setShowKey] = useState(false);
    const [testState, setTestState] = useState<TestState>('idle');
    const [testMsg, setTestMsg] = useState('');

    if (!open) return null;

    const handleTest = async () => {
        setTestState('testing');
        setTestMsg('');
        try {
            const client = new SyncthingClient(url.trim(), apiKey.trim());
            const status = await client.getSystemStatus();
            setTestState('ok');
            setTestMsg(`Connected! Device ID: ${status.myID.slice(0, 12)}…`);
        } catch (err) {
            setTestState('error');
            setTestMsg(
                err instanceof SyncthingApiError
                    ? err.advice
                    : err instanceof Error
                        ? err.message
                        : 'Unknown error',
            );
        }
    };

    const handleSave = () => {
        const cfg = { name: name.trim() || url.trim(), url: url.trim(), apiKey: apiKey.trim() };
        if (editId) {
            updateServer(editId, cfg);
        } else {
            addServer(cfg);
        }
        onClose();
    };

    const canSave = url.trim().length > 7 && apiKey.trim().length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md mx-4 card border-slate-600/60 shadow-2xl shadow-black/50 animate-slide-up">
                <div className="flex items-center justify-between border-b border-slate-700/60 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-brand-600/20 p-2">
                            <Server className="h-4 w-4 text-brand-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-slate-100">
                                {editId ? 'Edit Server' : 'Add Syncthing Server'}
                            </h2>
                            <p className="text-xs text-slate-400">Connect to a Syncthing instance</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Display Name <span className="text-slate-500">(optional)</span>
                        </label>
                        <input
                            className="input"
                            placeholder="My Home Server"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Syncthing GUI URL <span className="text-red-400">*</span>
                        </label>
                        <input
                            className="input font-mono text-xs"
                            placeholder="http://192.168.1.100:8384"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <p className="mt-1.5 text-xs text-slate-500">
                            Base URL of the Syncthing GUI, including protocol and port.
                        </p>
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            API Key <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                className={cn('input font-mono text-xs pr-10', !showKey && 'tracking-wider')}
                                type={showKey ? 'text' : 'password'}
                                placeholder="Found in Syncthing GUI → Settings → API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <button
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                                onClick={() => setShowKey((v) => !v)}
                                type="button"
                            >
                                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    </div>

                    {/* CORS notice */}
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 flex gap-2.5">
                        <span className="text-amber-400 mt-0.5">⚠</span>
                        <p className="text-xs text-amber-300/80 leading-relaxed">
                            Syncthing must have{' '}
                            <strong className="text-amber-300">Allow Cross-Origin Requests</strong> enabled in
                            GUI → Settings → GUI for the browser to connect.
                        </p>
                    </div>

                    {/* Test result */}
                    {testState !== 'idle' && (
                        <div
                            className={cn(
                                'rounded-lg border px-3 py-2.5 flex items-start gap-2 text-xs',
                                testState === 'ok'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                    : testState === 'error'
                                        ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                        : 'border-slate-600/40 bg-slate-700/30 text-slate-400',
                            )}
                        >
                            {testState === 'testing' && <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 mt-0.5" />}
                            {testState === 'ok' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                            {testState === 'error' && <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                            <span>{testState === 'testing' ? 'Testing connection…' : testMsg}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-700/60 px-6 py-4 gap-3">
                    <button
                        className="btn-secondary text-xs"
                        onClick={handleTest}
                        disabled={!canSave || testState === 'testing'}
                    >
                        {testState === 'testing' && <Loader2 className="h-3 w-3 animate-spin" />}
                        Test Connection
                    </button>
                    <div className="flex gap-2">
                        <button className="btn-ghost text-xs" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="btn-primary text-xs"
                            onClick={handleSave}
                            disabled={!canSave}
                        >
                            {editId ? 'Save Changes' : 'Add Server'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
