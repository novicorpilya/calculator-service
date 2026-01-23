import React from 'react';
import { RefreshCcw, Trash2, Plus } from 'lucide-react';
import { CalculationBreakdown } from '../CalculationBreakdown';
import type { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import type { User } from '@/features/auth/index.ts';

interface CalculationInventoryListProps {
    vm: CalculationViewModel;
    user: User | null;
    isAuditMode: boolean;
    canSeePrices: boolean;
    onSetAuditItemIndex: (index: number | null) => void;
    onRemoveItem: (index: number) => void;
}

/**
 * Senior UX Redesign: Responsive supply plan list.
 * Renamed "Спецификация" to "План снабжения объектов".
 * Optimized spacing and header layout for all devices.
 */
export const CalculationInventoryList: React.FC<CalculationInventoryListProps> = ({
    vm,
    user,
    isAuditMode,
    canSeePrices,
    onSetAuditItemIndex,
    onRemoveItem,
}) => {
    if (!vm.results) return null;

    return (
        <div className="space-y-10">
            {/* Header with Title and Total Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <div className="space-y-1">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-[0.3em]">
                        План снабжения объекта
                    </h3>
                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">
                        Рекомендованный перечень инвентаря и график обновлений
                    </p>
                </div>

                <div className="w-fit px-6 py-3 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col items-center sm:items-end group hover:bg-primary/20 transition-all cursor-default">
                    <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest mb-1 underline decoration-primary/20 underline-offset-4">
                        К оплате (закупка)
                    </span>
                    <span className="text-xl font-black text-primary tracking-tight">
                        {vm.totalCostDisplay}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {vm.results.summary.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.02] animate-in fade-in duration-700">
                        <div className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.3em]">
                            В списке пусто
                        </div>
                    </div>
                ) : (
                    vm.results.summary.map((item, i) => (
                        <div key={i} className="relative group/audit">
                            <CalculationBreakdown item={item} hidePrices={!canSeePrices} />

                            {/* Audit Controls: Modern Floating Actions */}
                            {isAuditMode &&
                                (user?.role === 'manager' || user?.role === 'admin') &&
                                ![
                                    'paid',
                                    'processing',
                                    'sent_to_warehouse',
                                    'ready',
                                    'shipping',
                                    'completed',
                                    'closed',
                                ].includes(vm.status) && (
                                    <div className="absolute top-4 right-4 z-[60] flex items-center gap-2 opacity-0 group-hover/audit:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onSetAuditItemIndex(i)}
                                            className="h-10 px-4 bg-primary text-background text-[10px] font-black uppercase rounded-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
                                        >
                                            <RefreshCcw size={14} />{' '}
                                            <span className="hidden sm:inline">Заменить</span>
                                        </button>
                                        <button
                                            onClick={() => onRemoveItem(i)}
                                            className="h-10 w-10 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg"
                                            title="Удалить позицию"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                )}
                        </div>
                    ))
                )}

                {/* Add New Item Button */}
                {isAuditMode &&
                    (user?.role === 'manager' || user?.role === 'admin') &&
                    ![
                        'paid',
                        'processing',
                        'sent_to_warehouse',
                        'ready',
                        'shipping',
                        'completed',
                        'closed',
                    ].includes(vm.status) && (
                        <button
                            onClick={() => onSetAuditItemIndex(-1)}
                            className="w-full py-10 border-2 border-dashed border-white/5 rounded-3xl text-foreground/20 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center gap-4 group/add"
                        >
                            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover/add:bg-primary/20 group-hover/add:text-primary transition-all">
                                <Plus size={28} />
                            </div>
                            <div className="text-center">
                                <span className="block text-[10px] font-black uppercase tracking-[0.3em]">
                                    Добавить позицию
                                </span>
                                <span className="block text-[9px] font-bold text-foreground/10 uppercase tracking-widest mt-1">
                                    В итоговый расчет снабжения
                                </span>
                            </div>
                        </button>
                    )}
            </div>
        </div>
    );
};
