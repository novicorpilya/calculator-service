import React from 'react';
import { useAuth } from '@/features/auth/index.ts';
import { useClientAnalytics } from '../../hooks/useClientAnalytics';
import { StatsGrid } from './StatsGrid';
import { CategoryChart } from './CategoryChart';
import { TrendChart } from './TrendChart';
import { Loader2, RefreshCw, Filter, Building2 } from 'lucide-react';
import { useServices } from '@/app/di/ServiceContainer';
import { type Venue } from '@/services/venue.service';

export const AnalyticsDashboard: React.FC = () => {
    const { user } = useAuth();
    const { venueService } = useServices();
    const [selectedVenueId, setSelectedVenueId] = React.useState<string | undefined>(undefined);
    const [venues, setVenues] = React.useState<Venue[]>([]);
    const {
        data: stats,
        isLoading,
        error,
        refetch,
    } = useClientAnalytics(user?.id, selectedVenueId);

    React.useEffect(() => {
        venueService.getVenues().then((res) => {
            if (res.success && res.data) setVenues(res.data);
        });
    }, [venueService]);

    if (isLoading) {
        return (
            <div className="py-32 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-[10px] font-black text-foreground/50 uppercase tracking-[0.3em] animate-pulse">
                    Собираем аналитику...
                </p>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className="py-24 text-center bg-red-500/5 border border-red-500/10 rounded-[3rem]">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">
                    Ошибка при загрузке аналитики
                </p>
                <button
                    onClick={() => refetch()}
                    className="flex items-center gap-2 mx-auto text-[10px] font-black text-primary uppercase tracking-widest"
                >
                    <RefreshCw size={14} /> Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-4 sm:gap-6">
                <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight">
                        Ваша эффективность
                    </h2>
                    <p className="text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em]">
                        Обзор ключевых показателей и структуры заказов
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative group flex-1 sm:flex-initial">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-foreground/50 group-focus-within:text-primary transition-colors">
                            <Building2 size={16} />
                        </div>
                        <select
                            value={selectedVenueId || ''}
                            onChange={(e) => setSelectedVenueId(e.target.value || undefined)}
                            className="appearance-none w-full sm:w-auto bg-card border border-border-theme pl-12 pr-10 py-3 sm:py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer sm:min-w-[200px]"
                        >
                            <option value="">Все заведения</option>
                            {venues.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-foreground/20">
                            <Filter size={14} />
                        </div>
                    </div>

                    <button
                        onClick={() => refetch()}
                        className="p-3 sm:p-4 bg-card border border-border-theme rounded-2xl text-foreground/40 hover:text-primary hover:border-primary/30 transition-all active:scale-95 self-end sm:self-auto"
                        aria-label="Обновить данные"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <StatsGrid stats={stats} />

            <div className="grid grid-cols-1 gap-8">
                <TrendChart data={stats.monthlySpending} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <CategoryChart data={stats.topCategories} />

                {/* Right col: Insights or Top Vendors - Placeholder for now but styled */}
                <div className="bg-foreground text-background p-10 rounded-[3rem] space-y-10 relative overflow-hidden">
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-xl font-black uppercase tracking-tight">
                                Smart Инсайты
                            </h3>
                            <p className="text-[10px] font-black text-background/40 uppercase tracking-[0.2em]">
                                Автоматические выводы
                            </p>
                        </div>

                        <div className="space-y-4">
                            {(() => {
                                const insights = [];
                                if (stats?.totalVolume > 500000) {
                                    insights.push(
                                        'Ваш статус VIP позволяет заказать бесплатный экспресс-аудит зон'
                                    );
                                }
                                if ((stats?.avgDeliveryDays ?? 0) > 3) {
                                    insights.push(
                                        'Срок отгрузки выше среднего. Рекомендуем объединять заказы в один заезд'
                                    );
                                }
                                if (stats?.topCategories?.length > 0) {
                                    const top = stats.topCategories[0];
                                    insights.push(
                                        `Категория "${top.category}" составляет ${top.percentage}% ваших трат. Проверьте остатки`
                                    );
                                }

                                // Default logic if stats are thin
                                if (insights.length < 3) {
                                    insights.push(
                                        'Система проанализирует ваши будущие заказы для поиска паттернов экономии'
                                    );
                                }

                                return insights.map((insight, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-4 bg-background/5 p-4 rounded-2xl border border-background/10"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                        <p className="text-[11px] font-bold tracking-wide uppercase leading-relaxed text-background/80">
                                            {insight}
                                        </p>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2" />
                </div>
            </div>
        </div>
    );
};
