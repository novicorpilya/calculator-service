import React from 'react';
import type { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import type { CalculationEntity } from '@/core/domain/CalculationEntity';
import type { InventoryItem } from '@/features/dashboard/dashboard.types';

interface CalculationZonesBreakdownProps {
    vm: CalculationViewModel;
    entity: CalculationEntity;
}

export const CalculationZonesBreakdown: React.FC<CalculationZonesBreakdownProps> = ({ entity }) => {
    if (!entity.results?.byZone) return null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 delay-300">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] pl-1 opacity-40">
                Детализация по зонам
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {entity.byZone.map((zone, i) => (
                    <div
                        key={i}
                        className="glass-card !p-6 relative group overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div
                                className="w-16 h-16 rounded-full"
                                style={{ backgroundColor: zone.color }}
                            ></div>
                        </div>
                        <h4 className="font-bold text-lg mb-1">{zone.zoneName}</h4>
                        <div className="text-[10px] uppercase tracking-widest opacity-50 mb-4">
                            {zone.type}
                        </div>
                        <div className="space-y-2">
                            {zone.items.slice(0, 3).map((item: InventoryItem, j: number) => (
                                <div
                                    key={j}
                                    className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0"
                                >
                                    <span className="opacity-80 truncate pr-4">{item.inventory}</span>
                                    <span className="font-mono opacity-50 whitespace-nowrap">
                                        {item.quantity} шт
                                    </span>
                                </div>
                            ))}
                            {zone.items.length > 3 && (
                                <div className="text-[10px] text-primary pt-2 font-bold uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                                    + еще {zone.items.length - 3} позиций
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
