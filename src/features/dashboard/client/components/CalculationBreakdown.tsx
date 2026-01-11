import React from 'react';
import { type InventoryItem, ZONE_TYPES } from '../../dashboard.types';
import { ShieldCheck, TrendingUp, Info } from 'lucide-react';

interface CalculationBreakdownProps {
    item: InventoryItem;
    hidePrices?: boolean;
}

/**
 * Professional Detail Card for a single inventory item.
 * Shows the full calculation logic based on BICSc + ISO 18406.
 */
// Final component export
export const CalculationBreakdown = React.memo(({ item, hidePrices }: CalculationBreakdownProps) => {
    if (!item.calculation) return null;

    const {
        monthlyOrder, annualConsumption, annualBudget,
        reorderPoint
    } = item.calculation;

    const zoneLabel = ZONE_TYPES.find(z => z.color === item.color)?.label || 'Универсальная';

    return (
        <div className="glass-card !bg-white/[0.03] border-white/10 shadow-2xl hover:border-primary/40 hover:bg-white/[0.05] transition-all duration-500 overflow-hidden group">
            {/* Header: Item & Core Numbers */}
            <div className="p-8 border-b border-border-theme bg-primary/5 flex flex-wrap items-center justify-between gap-6">
                <div className="space-y-2 min-w-[200px]">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{zoneLabel}</span>
                    </div>
                    <h4 className="text-2xl font-black leading-tight tracking-tight">{item.inventory}</h4>
                    <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                        АРТ: {item.sku || 'N/A'} {!hidePrices && `— ${Math.round(item.price).toLocaleString()} ₽/ед`}
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-12">
                    <div className="text-left py-4 px-6 bg-background rounded-2xl border border-border-theme flex flex-col justify-between">
                        <div className="flex items-center gap-2">
                            <p className="text-[8px] font-black text-foreground/40 uppercase tracking-widest leading-none">В работе на объекте</p>
                            <div className="group/info relative">
                                <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-all cursor-help">
                                    <Info size={11} className="text-foreground/40 group-hover/info:text-foreground transition-colors" />
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-foreground text-background text-[9px] font-bold rounded-xl opacity-0 group-hover/info:opacity-100 transition-all translate-y-2 group-hover/info:translate-y-0 pointer-events-none z-50 shadow-3xl border border-white/10">
                                    База — сколько инвентаря должно быть на объекте постоянно для полноценной работы
                                </div>
                            </div>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-foreground mt-4">
                            {Math.ceil(item.quantity)}<span className="text-xs ml-1 text-foreground/20">ШТ</span>
                        </p>
                    </div>
                    <div className="text-left py-4 px-6 bg-primary/10 rounded-2xl border border-primary/20 flex flex-col justify-between">
                        <div className="flex items-center gap-2">
                            <p className="text-[8px] font-black text-primary uppercase tracking-widest leading-none">Расход за месяц</p>
                            <div className="group/info relative">
                                <div className="w-5 h-5 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center hover:bg-primary/30 hover:border-primary/40 transition-all cursor-help">
                                    <Info size={11} className="text-primary group-hover/info:scale-110 transition-transform" />
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-foreground text-background text-[9px] font-bold rounded-xl opacity-0 group-hover/info:opacity-100 transition-all translate-y-2 group-hover/info:translate-y-0 pointer-events-none z-50 shadow-3xl border border-white/10">
                                    Расход и замена — прогноз износа инвентаря, требующий регулярного восполнения
                                </div>
                            </div>
                        </div>
                        <p className="text-3xl font-black tracking-tighter text-primary mt-4">
                            {Math.ceil(monthlyOrder)}<span className="text-xs ml-1 opacity-40">ШТ</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-8">
                {/* Operational Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60 border-b border-primary/10 pb-4">
                            <TrendingUp size={14} /> Финансовое планирование
                        </h5>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Годовое потребление:</span>
                                <span className="text-sm font-black">{Math.ceil(annualConsumption)} шт</span>
                            </div>
                            {!hidePrices ? (
                                <div className="flex justify-between items-center group/item">
                                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Бюджет на год:</span>
                                    <span className="text-sm font-black text-primary">{Math.round(annualBudget).toLocaleString()} ₽</span>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center gap-4 py-0.5">
                                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider whitespace-nowrap">Коммерческие условия:</span>
                                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.15em] bg-primary/5 px-3 py-1 rounded-full border border-primary/10 whitespace-nowrap">
                                        На этапе договора
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500/60 border-b border-emerald-500/10 pb-4">
                            <ShieldCheck size={14} /> График снабжения
                        </h5>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Пополнить при остатке:</span>
                                    <div className="group/info relative">
                                        <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-white/30 transition-all cursor-help">
                                            <Info size={11} className="text-foreground/40 group-hover/info:text-foreground transition-colors" />
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-foreground text-background text-[9px] font-bold rounded-xl opacity-0 group-hover/info:opacity-100 transition-all translate-y-2 group-hover/info:translate-y-0 pointer-events-none z-50 shadow-3xl border border-white/10">
                                            Минимальный запас — сделайте заказ, когда на складе останется это количество
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-emerald-500">{Math.ceil(reorderPoint)} шт</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Цикл обновления:</span>
                                <span className="text-sm font-black italic">каждые {item.norms?.replacementCycle} дней</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subtle Progress Bar */}
            <div className="h-1 w-full bg-primary/5">
                <div className="h-full bg-primary/20 w-full" />
            </div>
        </div>
    );
});

