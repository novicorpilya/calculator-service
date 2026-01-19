import React from 'react';
import type { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import type { CalculationEntity } from '@/core/domain/CalculationEntity';
import type { InventoryItem } from '@/features/dashboard/dashboard.types';

interface CalculationZonesBreakdownProps {
    vm: CalculationViewModel;
    entity: CalculationEntity;
}

/**
 * Senior UX Redesign: Premium Dashboard Zones
 * Modular bento grid for zone summaries with visual emphasis on color coding.
 */
export const CalculationZonesBreakdown: React.FC<CalculationZonesBreakdownProps> = ({ entity }) => {
    if (!entity.results?.byZone) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <div className="flex items-center gap-4 px-1">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">
                    Детализация по зонам
                </h3>
                <div className="h-px flex-grow bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {entity.byZone.map((zone, i) => (
                    <div
                        key={i}
                        className="glass-card !bg-white/[0.01] border-white/5 !p-0 relative group overflow-hidden hover:border-white/10 transition-all duration-500"
                    >
                        {/* Zone Header with colored accent */}
                        <div className="p-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="font-black text-base tracking-tight">{zone.zoneName}</h4>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: zone.color }} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">
                                        ID: {zone.type?.toUpperCase() || 'GENERAL'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-foreground/80">{zone.area} м²</p>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/20">Площадь</p>
                            </div>
                        </div>

                        {/* Items Preview */}
                        <div className="p-6 space-y-3">
                            <div className="space-y-2">
                                {zone.items.slice(0, 3).map((item: InventoryItem, j: number) => (
                                    <div
                                        key={j}
                                        className="flex items-center justify-between text-[11px] py-1"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-1 h-1 rounded-full bg-foreground/20" />
                                            <span className="text-foreground/60 truncate font-medium">{item.inventory}</span>
                                        </div>
                                        <span className="font-mono text-[10px] text-foreground/30 whitespace-nowrap ml-4">
                                            {Math.ceil(item.quantity)} ед.
                                        </span>
                                    </div>
                                ))}
                            </div>
                            
                            {zone.items.length > 3 ? (
                                <div className="pt-3 flex items-center justify-between border-t border-white/5">
                                    <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">
                                        + еще {zone.items.length - 3} позиций
                                    </span>
                                    <div className="flex -space-x-1.5">
                                        {[...Array(Math.min(zone.items.length - 3, 3))].map((_, idx) => (
                                            <div key={idx} className="w-4 h-4 rounded-full border border-background bg-white/5" />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-3 text-[9px] font-black text-foreground/10 uppercase tracking-widest">
                                    Полный охват зоны
                                </div>
                            )}
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none"
                             style={{ backgroundColor: zone.color }} />
                    </div>
                ))}
            </div>
        </div>
    );
};
