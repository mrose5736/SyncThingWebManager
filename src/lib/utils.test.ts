import { describe, it, expect } from 'vitest';
import {
    formatBytes,
    formatUptime,
    calcSyncPercent,
    calcOverallSyncPercent,
    shortDeviceId,
    uuid,
} from './utils';

describe('formatBytes', () => {
    it('formats zero bytes', () => {
        expect(formatBytes(0)).toBe('0 B');
    });

    it('formats bytes under 1KB', () => {
        expect(formatBytes(512)).toBe('512 B');
    });

    it('formats kilobytes', () => {
        expect(formatBytes(2048)).toBe('2 KB');
    });

    it('formats gigabytes with default decimals', () => {
        expect(formatBytes(3_221_225_472)).toBe('3 GB');
    });

    it('respects custom decimal places', () => {
        expect(formatBytes(1_500_000, 2)).toBe('1.43 MB');
    });
});

describe('formatUptime', () => {
    it('formats seconds under a minute', () => {
        expect(formatUptime(45)).toBe('0m');
    });

    it('formats minutes', () => {
        expect(formatUptime(150)).toBe('2m');
    });

    it('formats hours and minutes', () => {
        expect(formatUptime(3_725)).toBe('1h 2m');
    });

    it('formats days and hours', () => {
        expect(formatUptime(90_000)).toBe('1d 1h');
    });
});

describe('calcSyncPercent', () => {
    it('returns 100 when there is nothing to sync (globalBytes is 0)', () => {
        expect(calcSyncPercent(0, 0)).toBe(100);
    });

    it('returns 100 when fully synced', () => {
        expect(calcSyncPercent(1000, 0)).toBe(100);
    });

    it('returns 0 when nothing is synced', () => {
        expect(calcSyncPercent(1000, 1000)).toBe(0);
    });

    it('computes a partial percentage', () => {
        expect(calcSyncPercent(1000, 250)).toBe(75);
    });

    it('clamps below 0 when needBytes exceeds globalBytes', () => {
        expect(calcSyncPercent(1000, 1500)).toBe(0);
    });
});

describe('calcOverallSyncPercent', () => {
    it('aggregates multiple folders', () => {
        const stats = {
            a: { globalBytes: 1000, needBytes: 0 },
            b: { globalBytes: 1000, needBytes: 1000 },
        };
        // (2000 - 1000) / 2000 = 50%
        expect(calcOverallSyncPercent(stats)).toBe(50);
    });

    it('returns 100 for an empty folder set', () => {
        expect(calcOverallSyncPercent({})).toBe(100);
    });
});

describe('shortDeviceId', () => {
    it('truncates long IDs to 8 chars plus ellipsis', () => {
        expect(shortDeviceId('ABCDEFGHIJKLMNOP')).toBe('ABCDEFGH…');
    });

    it('leaves short IDs untouched', () => {
        expect(shortDeviceId('ABCD')).toBe('ABCD');
    });
});

describe('uuid', () => {
    it('generates a well-formed v4 UUID', () => {
        const id = uuid();
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('generates unique values across calls', () => {
        const ids = new Set(Array.from({ length: 50 }, () => uuid()));
        expect(ids.size).toBe(50);
    });
});
