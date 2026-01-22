import React, { useEffect, useState } from 'react';
import { useServices } from '@/app/di/ServiceContainer';
import { Activity, Clock, User, CheckCircle2, ArrowRightLeft, TrendingUp } from 'lucide-react';

interface ProjectTimelineProps {
    calculationId: string;
}

interface TimelineEvent {
    id: string;
    action: string;
    created_at: string;
    details?: Record<string, unknown>;
    profiles?: { email?: string };
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ calculationId }) => {
    const { managerDashboardService } = useServices();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadTimeline = async () => {
            setLoading(true);
            const res = await managerDashboardService.getProjectTimeline(calculationId);
            if (!cancelled) {
                if (res.success) {
                    setEvents((res.data as TimelineEvent[]) || []);
                }
                setLoading(false);
            }
        };

        loadTimeline();

        return () => {
            cancelled = true;
        };
    }, [calculationId, managerDashboardService]);

    const getIcon = (action: string) => {
        switch (action) {
            case 'invitation_created':
                return <User size={14} />;
            case 'calculation_status_force_updated':
            case 'project_status_update':
                return <ArrowRightLeft size={14} />;
            case 'margin_update':
                return <TrendingUp size={14} />;
            case 'calculation_manager_assigned':
                return <CheckCircle2 size={14} />;
            default:
                return <Activity size={14} />;
        }
    };

    if (loading)
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-foreground/5" />
                        <div className="flex-1 space-y-2">
                            <div className="h-2 w-1/4 bg-foreground/5 rounded" />
                            <div className="h-4 w-3/4 bg-foreground/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        );

    if (events.length === 0)
        return (
            <div className="py-20 text-center opacity-20 italic">
                <Clock size={40} className="mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">История пуста</p>
            </div>
        );

    return (
        <div className="relative space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-primary/40 before:to-transparent">
            {events.map((event) => (
                <div key={event.id} className="relative flex gap-6 group">
                    <div className="relative z-10 w-8 h-8 rounded-full bg-background border-2 border-primary/20 flex items-center justify-center text-primary group-hover:border-primary group-hover:scale-110 transition-all shadow-sm">
                        {getIcon(event.action)}
                    </div>

                    <div className="flex-1 space-y-1.5 pb-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50 flex items-center gap-1.5">
                                <Clock size={10} /> {new Date(event.created_at).toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold text-foreground/20 italic">
                                {event.profiles?.email || 'System'}
                            </span>
                        </div>
                        <p className="text-[13px] font-bold text-foreground/80 leading-relaxed">
                            {event.action.split('_').join(' ').toUpperCase()}
                        </p>
                        {event.details && Object.keys(event.details).length > 0 && (
                            <div className="p-3 bg-foreground/[0.02] rounded-xl border border-border-theme/40 text-[11px] text-foreground/50 font-medium">
                                {Object.entries(event.details).map(([key, val]) => (
                                    <div key={key} className="flex gap-2">
                                        <span className="font-black uppercase text-[9px] tracking-widest opacity-40">
                                            {key}:
                                        </span>
                                        <span className="truncate">{String(val)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
