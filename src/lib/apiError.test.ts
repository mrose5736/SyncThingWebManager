import { describe, it, expect } from 'vitest';
import { SyncthingApiError } from './apiError';

describe('SyncthingApiError', () => {
    it('carries type and status code', () => {
        const err = new SyncthingApiError('boom', 'AUTH', 401);
        expect(err.message).toBe('boom');
        expect(err.type).toBe('AUTH');
        expect(err.statusCode).toBe(401);
        expect(err.name).toBe('SyncthingApiError');
        expect(err).toBeInstanceOf(Error);
    });

    it('defaults statusCode to null', () => {
        const err = new SyncthingApiError('boom', 'OFFLINE');
        expect(err.statusCode).toBeNull();
    });

    it.each([
        ['OFFLINE', /reach the server/i],
        ['AUTH', /invalid api key/i],
        ['CORS', /cross-origin/i],
        ['UNKNOWN', /unexpected error/i],
    ] as const)('gives sensible advice for type=%s', (type, expected) => {
        const err = new SyncthingApiError('boom', type);
        expect(err.advice).toMatch(expected);
    });
});
