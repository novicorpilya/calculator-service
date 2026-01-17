import React, { useEffect, useState, useCallback } from 'react';
import { History } from 'lucide-react';
import { SettingsService } from '@/services/settings.service';

interface ConfigLog {
    id: string;
    action: string;
    created_at: string;
    user_id: string;
    details: Record<string, unknown>;
    profiles?: { email: string };
}

export const ConfigHistoryTab: React.FC = () => {
    const [logs, setLogs] = useState<ConfigLog[]>([]);
    const [loading, setLoading] = useState(true);

    const loadLogs = useCallback((isManualRefresh = false) => {
        if (isManualRefresh) {
            setLoading(true);
        }
        SettingsService.getAuditLogs()
            .then(setLogs)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        // Initial load. loading is already true by default.
        SettingsService.getAuditLogs()
            .then(setLogs)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading && logs.length === 0) {
        return (
            <div className="flex items-center justify-center py-12 text-muted-foreground animate-pulse">
                Загрузка истории...
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <History className="text-primary" size={20} />
                    Журнал изменений
                </h3>
                <button 
                    onClick={() => loadLogs(true)}
                    className="text-sm text-primary hover:underline"
                >
                    Обновить
                </button>
            </div>

            <div className="space-y-2">
                {logs.map((log) => (
                    <div key={log.id} className="bg-muted/30 dark:bg-black/20 p-4 rounded-xl border border-border/40 dark:border-white/5 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${log.action === 'CONFIG_UPDATE' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                <History size={16} />
                            </div>
                            <div>
                                <div className="font-bold text-foreground">
                                    {log.action === 'CONFIG_UPDATE' ? 'Изменение конфигурации' : log.action}
                                </div>
                                <div className="text-muted-foreground text-xs flex gap-2">
                                    <span>{new Date(log.created_at).toLocaleString()}</span>
                                    <span className="opacity-50">•</span>
                                    <span className="font-mono">{log.profiles?.email || (log.user_id ? `${log.user_id.slice(0, 8)}...` : 'System')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded">
                                {JSON.stringify(log.details).slice(0, 50)}...
                            </div>
                        </div>
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        История изменений пуста
                    </div>
                )}
            </div>
        </div>
    );
};
