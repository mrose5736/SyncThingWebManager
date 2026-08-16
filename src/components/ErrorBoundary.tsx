import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

/**
 * Top-level crash guard. This app is meant to run unattended as a monitoring
 * dashboard, so an uncaught render error should show a recoverable screen
 * instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error('Unhandled error in Syncthing Central UI:', error, info.componentStack);
    }

    private handleReload = () => {
        this.setState({ error: null });
        window.location.reload();
    };

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="flex min-h-screen items-center justify-center px-4">
                <div className="card w-full max-w-md border-red-500/30 p-6 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                    <h1 className="mb-2 text-sm font-semibold text-slate-100">Something went wrong</h1>
                    <p className="mb-4 text-xs text-slate-400 leading-relaxed">
                        The dashboard hit an unexpected error and couldn't continue rendering. Reloading
                        usually fixes it; if it keeps happening, please{' '}
                        <a
                            href="https://github.com/mrose5736/SyncThingWebManager/issues"
                            target="_blank"
                            rel="noreferrer"
                            className="text-brand-400 underline underline-offset-2 hover:text-brand-300"
                        >
                            open an issue
                        </a>{' '}
                        with the details below.
                    </p>
                    <button className="btn-primary mx-auto mb-4" onClick={this.handleReload}>
                        <RotateCcw className="h-4 w-4" />
                        Reload
                    </button>
                    <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900/60 p-3 text-left text-[10px] text-slate-500">
                        {this.state.error.message}
                    </pre>
                </div>
            </div>
        );
    }
}
