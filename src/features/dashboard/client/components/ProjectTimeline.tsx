import React from 'react';
import {
    CheckCircle2,
    Clock,
    FilePlus,
    Send,
    MessageSquare,
    AlertCircle,
    CreditCard,
    ShieldCheck
} from 'lucide-react';
import type { Interaction, InteractionType } from '../../dashboard.types';

interface ProjectTimelineProps {
    history: Interaction[];
}

const getTimelineIcon = (type: InteractionType) => {
    switch (type) {
        case 'created': return <FilePlus className="w-4 h-4" />;
        case 'submitted': return <Send className="w-4 h-4" />;
        case 'comment': return <MessageSquare className="w-4 h-4" />;
        case 'revision': return <Clock className="w-4 h-4" />;
        case 'invoice': return <CreditCard className="w-4 h-4" />;
        case 'error': return <AlertCircle className="w-4 h-4" />;
        default: return <ShieldCheck className="w-4 h-4" />;
    }
};

const getTimelineColor = (type: InteractionType) => {
    switch (type) {
        case 'created': return 'bg-blue-500/10 text-blue-500';
        case 'submitted': return 'bg-primary/10 text-primary';
        case 'comment': return 'bg-orange-500/10 text-orange-500';
        case 'revision': return 'bg-purple-500/10 text-purple-500';
        case 'invoice': return 'bg-emerald-500/10 text-emerald-500';
        case 'error': return 'bg-red-500/10 text-red-500';
        default: return 'bg-slate-500/10 text-slate-500';
    }
};

export const ProjectTimeline: React.FC<ProjectTimelineProps> = React.memo(({ history }) => {
    if (!history || history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-foreground/20">
                <Clock size={40} className="mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">История событий пуста</p>
            </div>
        );
    }

    // Sort history by timestamp descending (newest first)
    const sortedHistory = [...history].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border-theme before:via-border-theme before:to-transparent">
            {sortedHistory.map((item, index) => (
                <div key={item.id || index} className="relative flex items-start gap-6 group">
                    {/* Icon Column */}
                    <div className={`
                        relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                        ${getTimelineColor(item.type)} transition-transform group-hover:scale-110 duration-300
                    `}>
                        {getTimelineIcon(item.type)}
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 pt-1 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                {item.user}
                            </span>
                            <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">
                                {new Date(item.timestamp).toLocaleString('ru-RU', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>

                        <div className="glass-card !p-5 !bg-card/30 border-transparent hover:border-primary/20 transition-all">
                            <p className="text-[13px] font-medium leading-relaxed mb-3">
                                {item.text}
                            </p>
                            {item.badge && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/10">
                                    <CheckCircle2 size={10} />
                                    {item.badge}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
});

ProjectTimeline.displayName = 'ProjectTimeline';
