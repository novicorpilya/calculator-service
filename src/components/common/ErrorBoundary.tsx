import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Production-grade Error Boundary to catch UI crashes and provide a graceful recovery.
 * Level: Senior Architecture
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[System:Crash]', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full glass-card !p-12 space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} />
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-3xl font-black tracking-tight uppercase">Системный сбой</h1>
                            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] leading-relaxed">
                                Произошла непредвиденная ошибка в работе интерфейса. Мы уже получили уведомление и работаем над исправлением.
                            </p>
                        </div>

                        {import.meta.env.DEV && (
                            <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl text-left">
                                <p className="text-[9px] font-mono text-red-400 break-all">{this.state.error?.message}</p>
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn-premium w-full flex items-center justify-center gap-3"
                            >
                                <RefreshCcw size={18} /> Перезагрузить страницу
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 hover:text-foreground transition-colors flex items-center justify-center gap-2"
                            >
                                <Home size={14} /> Вернуться на главную
                            </button>
                        </div>

                        <p className="text-[8px] font-bold text-foreground/10 uppercase tracking-widest pt-4">
                            Error ID: {Math.random().toString(36).slice(2, 10).toUpperCase()}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
