import React from 'react';
import { type InventoryItem, ZONE_TYPES } from '../../dashboard.types';
import { ShieldCheck, Package, ShoppingCart, CalendarRange } from 'lucide-react';

interface CalculationBreakdownProps {
    item: InventoryItem;
    hidePrices?: boolean;
}

/**
 * Senior UX Redesign: Ultra-Adaptive Product Card
 * 320px (Mobile) -> Full HD (Desktop)
 * Focus: High readability, Low noise, Fluid layout.
 */
export const CalculationBreakdown = React.memo(
    ({ item, hidePrices }: CalculationBreakdownProps) => {
        if (!item.calculation) return null;

        const { monthlyOrder, annualConsumption, annualBudget, reorderPoint } = item.calculation;
        const zoneObj = ZONE_TYPES.find((z) => z.color === item.color);
        const zoneLabel = zoneObj?.label || 'Склад';

        return (
            <div className="group relative glass-card !bg-white/[0.01] border-white/5 hover:border-primary/20 transition-all duration-300 shadow-xl overflow-hidden">
                {/* Visual Accent Line */}
                <div className="absolute top-0 left-0 w-1 lg:w-1.5 h-full opacity-60" style={{ backgroundColor: item.color }} />

                <div className="p-5 lg:p-7 flex flex-col gap-6 lg:gap-8">
                    {/* TOP SECTION: Header & Identity */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 max-w-xl">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-foreground/40">
                                    {zoneLabel.split('—')[0].trim()}
                                </span>
                                <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">
                                    {item.sku || 'REF-N/A'}
                                </span>
                            </div>
                            <h4 className="text-lg lg:text-xl font-black tracking-tight leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                                {item.inventory}
                            </h4>
                        </div>
                        
                        {!hidePrices && (
                            <div className="flex flex-col sm:items-end">
                                <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">Цена за единицу</p>
                                <span className="text-lg font-black text-foreground/80">
                                    {Math.round(item.price).toLocaleString()} ₽
                                </span>
                            </div>
                        )}
                    </div>

                    {/* MIDDLE SECTION: Operational Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {/* Supply Needed Now */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center gap-2 opacity-40">
                                <Package size={14} />
                                <span className="text-[9px] font-black uppercase tracking-wider">На объект</span>
                            </div>
                            <p className="text-2xl font-black text-foreground/90 leading-none">
                                {Math.ceil(item.quantity)} <span className="text-xs font-bold text-foreground/30">ШТ</span>
                            </p>
                        </div>

                        {/* Monthly Order */}
                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center gap-2 text-primary/60">
                                <ShoppingCart size={14} />
                                <span className="text-[9px] font-black uppercase tracking-wider">Заказ / мес</span>
                            </div>
                            <p className="text-2xl font-black text-primary leading-none">
                                {Math.ceil(monthlyOrder)} <span className="text-xs font-bold opacity-30">ШТ</span>
                            </p>
                        </div>

                        {/* Annual Budget */}
                        {!hidePrices && (
                            <div className="sm:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 opacity-40">
                                        <CalendarRange size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-wider">Бюджет в год</span>
                                    </div>
                                    <span className="text-[10px] font-bold opacity-20 uppercase">Прогноз</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <p className="text-2xl font-black text-foreground/90 leading-none">
                                        {Math.round(annualBudget).toLocaleString()} <span className="text-xs font-bold opacity-30">₽</span>
                                    </p>
                                    <p className="text-[10px] font-bold text-foreground/30 italic">
                                        ~{annualConsumption < 1 ? annualConsumption.toFixed(1) : Math.ceil(annualConsumption)} ед.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BOTTOM SECTION: Smart Indicators */}
                    <div className="pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-y-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 ring-1 ring-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 rounded-full">
                                <ShieldCheck size={14} className="text-emerald-500/60" />
                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Мин. остаток:</span>
                                <span className="text-xs font-black text-emerald-500">{Math.ceil(reorderPoint || 0)} ед.</span>
                            </div>
                            
                            <div className="flex items-center gap-2 px-3 py-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-foreground/20 animate-pulse" />
                                <span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Ротация:</span>
                                <span className="text-[11px] font-black text-foreground/60">{item.norms?.replacementCycle || 30} дн.</span>
                            </div>
                        </div>

                        <div className="hidden sm:block">
                            <span className="text-[9px] font-bold text-foreground/10 uppercase tracking-[0.4em]">СТАНДАРТ ISO 18406</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
);
