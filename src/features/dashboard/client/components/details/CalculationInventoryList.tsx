import React from 'react';
import { RefreshCcw, Trash2, Plus } from 'lucide-react';
import { CalculationBreakdown } from '../CalculationBreakdown';
import type { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import type { User } from '@/features/auth';

interface CalculationInventoryListProps {
    vm: CalculationViewModel;
    user: User | null;
    isAuditMode: boolean;
    canSeePrices: boolean;
    totalCost: number;
    totalUnits: number;
    onSetAuditItemIndex: (index: number | null) => void;
    onRemoveItem: (index: number) => void;
}

export const CalculationInventoryList: React.FC<CalculationInventoryListProps> = ({
    vm,
    user,
    isAuditMode,
    canSeePrices,
    totalCost,
    totalUnits,
    onSetAuditItemIndex,
    onRemoveItem,
}) => {
    if (!vm.results) return null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between ml-2">
                <h3 className="text-xs font-black text-foreground/50 uppercase tracking-[0.3em]">
                    Спецификация инвентаря
                </h3>
                <div className="px-6 py-2.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
                    {canSeePrices ? `${totalCost.toLocaleString()} ₽` : `${totalUnits.toLocaleString()} ед.`}
                </div>
            </div>
            
            <div className="space-y-6">
                {vm.results.summary.map((item, i) => (
                    <div key={i} className="relative group/audit">
                        <CalculationBreakdown item={item} hidePrices={!canSeePrices} />
                        {isAuditMode &&
                            (user?.role === 'manager' || user?.role === 'admin') &&
                            vm.status !== 'completed' &&
                            vm.status !== 'closed' && (
                                <div className="absolute top-8 right-8 z-[60] flex gap-2 pointer-events-auto">
                                    <button
                                        onClick={() => onSetAuditItemIndex(i)}
                                        className="px-4 py-2 bg-primary text-white text-[9px] font-black uppercase rounded-lg shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                    >
                                        <RefreshCcw size={12} /> Заменить
                                    </button>
                                    <button
                                        onClick={() => onRemoveItem(i)}
                                        className="p-2 bg-red-500 text-white rounded-lg shadow-xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}
                    </div>
                ))}

                {isAuditMode && (user?.role === 'manager' || user?.role === 'admin') && (
                    <button
                        onClick={() => onSetAuditItemIndex(-1)}
                        className="w-full py-8 border-2 border-dashed border-primary/20 rounded-[2rem] text-primary/40 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 group/add"
                    >
                        <div className="p-4 bg-primary/5 rounded-full group-hover/add:scale-110 transition-transform">
                            <Plus size={32} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                            Добавить позицию в расчет
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};
