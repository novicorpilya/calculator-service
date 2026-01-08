import React, { Component, type ReactNode } from 'react';
import { logger } from '@/core/utils/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in child component tree,
 * logs them, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log to telemetry
        logger.error('React Error Boundary caught an error', error, {
            componentStack: errorInfo.componentStack,
        });

        // Store error info for display
        this.setState({ errorInfo });

        // Call optional callback
        this.props.onError?.(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-8">
                    <div className="max-w-lg w-full text-center space-y-8">
                        {/* Icon */}
                        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-12 h-12 text-red-500" />
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black uppercase tracking-tight">
                                Произошла ошибка
                            </h1>
                            <p className="text-sm text-foreground/60">
                                Что-то пошло не так. Мы уже получили уведомление и работаем над исправлением.
                            </p>
                        </div>

                        {/* Error details (dev only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-left overflow-auto max-h-48">
                                <p className="text-xs font-mono text-red-500 mb-2">
                                    {this.state.error.message}
                                </p>
                                {this.state.errorInfo?.componentStack && (
                                    <pre className="text-[10px] text-foreground/40 whitespace-pre-wrap">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Попробовать снова
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-card border border-border-theme rounded-xl font-bold hover:border-primary transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                На главную
                            </button>
                        </div>

                        {/* Support link */}
                        <p className="text-xs text-foreground/40">
                            Если проблема повторяется, свяжитесь с{' '}
                            <a href="mailto:support@example.com" className="text-primary underline">
                                поддержкой
                            </a>
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
