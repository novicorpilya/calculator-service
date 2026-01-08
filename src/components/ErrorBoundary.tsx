/**
 * ErrorBoundary Component
 * Catches React errors and displays fallback UI.
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Error info:', errorInfo);

        this.props.onError?.(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[200px] flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900">
                    <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
                        Что-то пошло не так
                    </h3>
                    <p className="text-sm text-red-600/70 dark:text-red-400/70 text-center mb-4 max-w-md">
                        {this.state.error?.message || 'Произошла непредвиденная ошибка'}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Попробовать снова
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * HOC for wrapping components with error boundary.
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
): React.FC<P> {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

    const ComponentWithErrorBoundary: React.FC<P> = (props) => (
        <ErrorBoundary fallback={fallback}>
            <WrappedComponent {...props} />
        </ErrorBoundary>
    );

    ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

    return ComponentWithErrorBoundary;
}
