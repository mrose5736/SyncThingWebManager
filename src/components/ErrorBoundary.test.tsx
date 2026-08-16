import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
    throw new Error('kaboom');
}

describe('ErrorBoundary', () => {
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('renders children when nothing throws', () => {
        render(
            <ErrorBoundary>
                <div>All good</div>
            </ErrorBoundary>,
        );
        expect(screen.getByText('All good')).toBeInTheDocument();
    });

    it('renders a fallback UI and the error message when a child throws', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <Boom />
            </ErrorBoundary>,
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('kaboom')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
    });
});
