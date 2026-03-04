import { cn } from '@/lib/utils';

type Status = 'online' | 'offline' | 'auth_error' | 'loading' | 'syncing';

const LABELS: Record<Status, string> = {
    online: 'Online',
    offline: 'Offline',
    auth_error: 'Auth Error',
    loading: 'Connecting…',
    syncing: 'Syncing',
};

const BADGE: Record<Status, string> = {
    online: 'bg-emerald-400/15 text-emerald-300 border-emerald-500/30',
    offline: 'bg-red-400/15 text-red-300 border-red-500/30',
    auth_error: 'bg-amber-400/15 text-amber-300 border-amber-500/30',
    loading: 'bg-slate-400/15 text-slate-300 border-slate-500/30',
    syncing: 'bg-brand-400/15 text-brand-300 border-brand-500/30',
};

interface Props {
    status: Status;
    showDot?: boolean;
    className?: string;
}

export function ServerStatusBadge({ status, showDot = true, className }: Props) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
                BADGE[status],
                className,
            )}
        >
            {showDot && (
                <span
                    className={cn(
                        'status-dot',
                        status === 'loading' ? 'status-dot-loading' : `status-dot-${status}`,
                    )}
                />
            )}
            {LABELS[status]}
        </span>
    );
}
