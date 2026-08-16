import { Sparkles } from 'lucide-react';
import { DEMO_MODE } from '@/lib/demoMode';

export function DemoBanner() {
    if (!DEMO_MODE) return null;

    return (
        <div className="flex items-center justify-center gap-2 border-b border-brand-500/30 bg-brand-600/15 px-4 py-1.5 text-xs text-brand-200">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span>
                You're viewing a <strong>public demo</strong> with fake data — nothing here connects to a
                real Syncthing instance.{' '}
                <a
                    href="https://github.com/mrose5736/SyncThingWebManager"
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-2 hover:text-brand-100"
                >
                    Get the real thing on GitHub
                </a>
            </span>
        </div>
    );
}
