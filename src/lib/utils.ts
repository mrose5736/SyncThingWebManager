import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility to combine Tailwind classes safely (shadcn/ui convention) */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Format bytes to human-friendly string */
export function formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Format uptime seconds to human-friendly string */
export function formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

/** Return sync percentage (0–100) from folder stats */
export function calcSyncPercent(globalBytes: number, needBytes: number): number {
    if (globalBytes === 0) return 100;
    const synced = globalBytes - needBytes;
    return Math.max(0, Math.min(100, (synced / globalBytes) * 100));
}

/** Return overall sync percentage across all folders */
export function calcOverallSyncPercent(
    folderStats: Record<string, { globalBytes: number; needBytes: number }>,
): number {
    const totals = Object.values(folderStats).reduce(
        (acc, f) => ({
            global: acc.global + f.globalBytes,
            need: acc.need + f.needBytes,
        }),
        { global: 0, need: 0 },
    );
    return calcSyncPercent(totals.global, totals.need);
}

/** Truncate device ID for display: first 8 chars + … */
export function shortDeviceId(id: string): string {
    return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

/** Generate a random UUID v4 — works in all contexts including plain HTTP LAN access.
 *  crypto.randomUUID() requires a secure context (HTTPS/localhost); this falls back
 *  to crypto.getRandomValues() which is available everywhere, even over HTTP. */
export function uuid(): string {
    // Secure context (HTTPS / localhost)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Non-secure context (plain HTTP) — getRandomValues works everywhere
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
        bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    }
    // Last resort fallback
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}
