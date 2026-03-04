export type ApiErrorType = 'OFFLINE' | 'AUTH' | 'CORS' | 'UNKNOWN';

/**
 * Typed error thrown by SyncthingClient on failed requests.
 * Use `.type` to distinguish between network/auth/CORS failures.
 */
export class SyncthingApiError extends Error {
    public readonly type: ApiErrorType;
    public readonly statusCode: number | null;

    constructor(message: string, type: ApiErrorType, statusCode: number | null = null) {
        super(message);
        this.name = 'SyncthingApiError';
        this.type = type;
        this.statusCode = statusCode;
    }

    /** Human-readable advice for the UI to display */
    get advice(): string {
        switch (this.type) {
            case 'OFFLINE':
                return 'Cannot reach the server. Check the URL and ensure Syncthing is running.';
            case 'AUTH':
                return 'Invalid API key. Update it in Settings.';
            case 'CORS':
                return 'Cross-origin request blocked. In Syncthing GUI → Settings → GUI, enable "Allow Cross-Origin Requests".';
            default:
                return 'An unexpected error occurred. Check the console for details.';
        }
    }
}
