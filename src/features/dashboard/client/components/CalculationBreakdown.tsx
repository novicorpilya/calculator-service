import React from 'react';
import { type InventoryItem, ZONE_TYPES } from '../../dashboard.types';
import { Zap, ShieldCheck, TrendingUp, Info } from 'lucide-react';

interface CalculationBreakdownProps {
    item: InventoryItem;
}

/**
 * Professional Detail Card for a single inventory item.
 * Shows the full calculation logic based on BICSc + ISO 18406.
 */
export const CalculationBreakdown = React.memo(({ item }: CalculationBreakdownProps) => {
    if (!item.calculation) return null;

    const {
        qArea, qStaff, qVisitors,
        monthlyOrder, annualConsumption, annualBudget,
        reorderPoint, safetyStock, formula, breakdown
    } = item.calculation;

    const zoneLabel = ZONE_TYPES.find(z => z.color === item.color)?.label || 'Универсальная';

    return (
        <div className="glass-card !bg-card border-transparent hover:border-primary/20 transition-all duration-500 overflow-hidden group">
            {/* Header: Item & Zone */}
            <div className="p-8 border-b border-border-theme bg-primary/5 flex items-start justify-between">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: item.color }} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{zoneLabel}</span>
                    </div>
                    <h4 className="text-2xl font-black leading-tight tracking-tight">{item.inventory}</h4>
                    <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">АРТ: {item.sku || 'N/A'}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-foreground/40 uppercase tracking-widest mb-1">Запас в наличии</p>
                    <p className="text-4xl font-black tracking-tighter text-primary">
                        {item.quantity}<span className="text-sm ml-1 text-foreground/40">ШТ</span>
                    </p>
                </div>
            </div>

            <div className="p-8 space-y-10">
                {/* 1. Demand Components */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2 p-4 rounded-2xl bg-background border border-border-theme">
                        <p className="text-[8px] font-black text-foreground/40 uppercase tracking-widest">По площади (Q_area)</p>
                        <p className="text-xl font-black">{qArea} <span className="text-[10px] text-foreground/30 uppercase">ед</span></p>
                    </div>
                    <div className="space-y-2 p-4 rounded-2xl bg-background border border-border-theme">
                        <p className="text-[8px] font-black text-foreground/40 uppercase tracking-widest">По персоналу (Q_staff)</p>
                        <p className="text-xl font-black">{qStaff} <span className="text-[10px] text-foreground/30 uppercase">ед</span></p>
                    </div>
                    <div className="space-y-2 p-4 rounded-2xl bg-background border border-border-theme">
                        <p className="text-[8px] font-black text-foreground/40 uppercase tracking-widest">По трафику (Q_visitors)</p>
                        <p className="text-xl font-black">{qVisitors} <span className="text-[10px] text-foreground/30 uppercase">ед/д</span></p>
                    </div>
                </div>

                {/* 2. Professional Formula Section */}
                <div className="relative p-6 rounded-3xl bg-foreground text-background shadow-2xl overflow-hidden group/formula">
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3 opacity-50">
                            <Zap size={14} className="text-primary" />
                            <span className="text-[8px] font-black uppercase tracking-[0.3em]">Математическая модель (ISO 18406)</span>
                        </div>
                        <p className="text-lg sm:text-xl font-mono font-black tracking-tighter leading-none">
                            {formula}
                        </p>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                            <Info size={12} className="text-primary" />
                            <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed tracking-wider">
                                {breakdown}
                            </p>
                        </div>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                </div>

                {/* 3. Operational Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                            <TrendingUp size={14} /> Прогноз расхода
                        </h5>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-border-theme">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase">Годовое потребление:</span>
                                <span className="text-sm font-black">{annualConsumption} шт</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border-theme">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase">Годовой бюджет:</span>
                                <span className="text-sm font-black text-primary">{annualBudget.toLocaleString()} ₽</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase">Месячный заказ:</span>
                                <span className="text-sm font-black">{monthlyOrder} шт</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h5 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                            <ShieldCheck size={14} /> Управление запасами
                        </h5>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-border-theme">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase">Точка перезаказа (ROP):</span>
                                <span className="text-sm font-black">{reorderPoint} шт</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border-theme">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase">Страховой запас:</span>
                                <span className="text-sm font-black">{safetyStock} шт</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase">Цикл замены:</span>
                                <span className="text-sm font-black">Раз в {item.norms?.replacementCycle} дн</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual indicator of completeness */}
            <div className="h-1.5 w-full bg-emerald-500/20">
                <div className="h-full bg-emerald-500 w-full animate-in slide-in-from-left duration-1000" />
            </div>
        </div>
    );
});
