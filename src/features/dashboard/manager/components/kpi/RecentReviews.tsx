import React from 'react';
import { Star, TrendingUp } from 'lucide-react';
import type { KPIData } from '../../hooks/useManagerKPI';

interface RecentReviewsProps {
    data: KPIData | null;
}

export const RecentReviews: React.FC<RecentReviewsProps> = ({ data }) => {
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="glass-card !p-8 h-full flex flex-col bg-background/60">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-black tracking-tighter mb-1">NPS & Отзывы</h3>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-primary/5 flex items-center gap-2">
                    <Star size={16} className="text-primary" fill="currentColor" />
                    <span className="text-lg font-black text-primary">
                        {data?.avgRating.toFixed(1) || '0.0'}
                    </span>
                </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {data?.recentReviews && data.recentReviews.length > 0 ? (
                    data.recentReviews.map((r) => (
                        <div
                            key={r.id}
                            className="p-5 rounded-3xl bg-foreground/[0.03] border border-border-theme"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-0.5 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">
                                        <Star size={10} fill="currentColor" />
                                        <span className="text-xs font-black">{r.rating}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-foreground/20 uppercase">
                                        {formatDate(r.createdAt)}
                                    </span>
                                </div>
                                <div className="text-[9px] font-bold text-foreground/50 uppercase">
                                    Проект {r.projectNumber}
                                </div>
                            </div>
                            <p className="text-xs font-semibold leading-relaxed text-foreground/70 italic">
                                «{r.comment || 'Клиент оставил оценку без комментария'}»
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Star size={40} />
                        <p className="text-xs font-bold uppercase mt-4">Отзывов пока нет</p>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-border-theme flex items-center justify-between">
                <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest">
                    Аналитика за 30 дней
                </span>
                <TrendingUp size={12} className="text-emerald-500" />
            </div>
        </div>
    );
};
