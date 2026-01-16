import React from 'react';
import { History, Clock } from 'lucide-react';
import type { AuditLog } from '@/services/audit.service';

interface AdminLogsTableProps {
    logs: AuditLog[];
}

export const AdminLogsTable: React.FC<AdminLogsTableProps> = ({ logs }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40 ml-2 flex items-center gap-2">
                <History size={14} /> История действий системы
            </h3>
            <div className="glass-card !p-0 overflow-hidden">
                <div className="divide-y divide-border-theme">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            className="p-4 hover:bg-primary/5 transition-colors flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-background border border-border-theme flex items-center justify-center text-foreground/40">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">
                                        <span className="text-primary">{log.profiles?.email}</span>
                                        <span className="text-foreground/60 mx-2">→</span>
                                        <span className="uppercase text-[10px] tracking-widest bg-foreground/5 px-2 py-0.5 rounded">
                                            {log.action.replace(/_/g, ' ')}
                                        </span>
                                    </p>
                                    <p className="text-[10px] text-foreground/30 font-bold mt-1 uppercase tracking-tighter">
                                        {new Date(log.created_at).toLocaleString()} •{' '}
                                        {log.entity_type} {log.entity_id?.slice(0, 8)}
                                    </p>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <pre className="text-[9px] text-foreground/40 font-mono bg-black/20 p-2 rounded-lg max-w-[200px] truncate">
                                    {JSON.stringify(log.details)}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
