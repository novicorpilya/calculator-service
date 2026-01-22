import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useServices } from '@/app/di/ServiceContainer';
import type { Calculation, InventoryItem, CalculationResults } from '@/core/types/calculation';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import {
    History,
    ChevronRight,
    ArrowRight,
    Plus,
    Minus,
    Edit3,
    Clock,
    Settings,
} from 'lucide-react';

interface CalculationHistoryProps {
    calculation: Calculation;
    user: { role?: string; id?: string } | null;
}

interface VersionData {
    id: string;
    version_number: number;
    created_at: string;
    change_reason?: string;
    snapshot_data: Record<string, unknown>;
}

interface VersionAdjustment {
    field: string;
    old: number;
    new: number;
}

export const CalculationHistory: React.FC<CalculationHistoryProps> = ({ calculation, user }) => {
    const { calculationService } = useServices();
    const [versions, setVersions] = useState<VersionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [clearing, setClearing] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<VersionData | null>(null);

    const fetchVersions = useCallback(async () => {
        setLoading(true);
        const res = await calculationService.getVersionHistory(calculation.id);
        if (res.success) {
            setVersions((res.data || []) as unknown as VersionData[]);
        }
        setLoading(false);
    }, [calculation.id, calculationService]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVersions();
        }, 0);
        return () => clearTimeout(timer);
    }, [fetchVersions]);

    const queryClient = useQueryClient();

    const filteredVersions = React.useMemo(() => {
        return versions.filter((v) => {
            if (user?.role === 'manager' || user?.role === 'admin') return true;
            const reason = v.change_reason || '';
            if (reason === 'Expert adjustment') return false;
            if (reason === 'Ручной снимок перед обновлением статуса') return false;
            return true;
        });
    }, [versions, user?.role]);

    const selectedIdx = selectedVersion
        ? filteredVersions.findIndex((v) => v.id === selectedVersion.id)
        : -1;

    const getVersionCost = React.useCallback(
        (v: VersionData) => {
            if (!v?.snapshot_data) return 0;
            const sd = v.snapshot_data;

            // If total_cost is explicitly explicitly, use it (it's already gross)
            if (typeof sd.total_cost === 'number') return sd.total_cost;

            // Fallback: calculate from results/adjustments to ensure we have a Gross total
            // This handles older snapshots that might only have 'results' or 'totalAnnualBudget'
            const results =
                (sd.results as CalculationResults) ||
                (sd.totalAnnualBudget ? (sd as unknown as CalculationResults) : null);
            const adjustments = (sd.adjustments as Record<string, unknown>) || {};

            // Use Entity to apply VAT and adjustments logic consistently
            const tempEntity = new CalculationEntity({
                ...calculation,
                results,
                manager_adjustments: adjustments,
                totalCost: (sd.total_cost as number) || (sd.totalAnnualBudget as number) || 0,
            });

            return tempEntity.totalCost;
        },
        [calculation]
    );

    const diff = React.useMemo(() => {
        if (!selectedVersion) return null;
        const baseSnapshot = filteredVersions[selectedIdx + 1]?.snapshot_data || null;
        const snapshotResults =
            selectedVersion.snapshot_data?.results ||
            (selectedVersion.snapshot_data?.totalAnnualBudget
                ? selectedVersion.snapshot_data
                : null);

        const targetEntity = new CalculationEntity({
            ...calculation,
            results: snapshotResults as CalculationResults,
            manager_adjustments:
                (selectedVersion.snapshot_data?.adjustments as Record<string, unknown>) || {},
            totalCost: getVersionCost(selectedVersion),
        });
        return targetEntity.getDiff(baseSnapshot);
    }, [selectedVersion, filteredVersions, selectedIdx, calculation, getVersionCost]);

    const handleClearHistory = async () => {
        if (
            !window.confirm(
                'Вы уверены, что хотите полностью очистить историю изменений? Это действие невозвратно.'
            )
        )
            return;

        setClearing(true);
        const res = await calculationService.clearVersionHistory(calculation.id);
        if (res.success) {
            setVersions([]);
            setSelectedVersion(null);
            // Invalidate query to reset version number in frontend state
            queryClient.invalidateQueries({ queryKey: ['calculations', 'detail', calculation.id] });
            toast.success('История очищена');
        }
        setClearing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (filteredVersions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-foreground/20">
                    <History size={32} />
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">
                        История пуста
                    </p>
                    <p className="text-[9px] font-bold text-foreground/20 italic">
                        Изменения появятся после аудита экспертом
                    </p>
                </div>
            </div>
        );
    }

    const currentEntity = new CalculationEntity(calculation);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Version List */}
            <div className="lg:col-span-4 space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">
                        Контрольные точки
                    </h3>
                    {(user?.role === 'manager' || user?.role === 'admin') &&
                        versions.length > 0 && (
                            <button
                                onClick={handleClearHistory}
                                disabled={clearing}
                                className="text-[9px] font-black uppercase tracking-widest text-rose-500/50 hover:text-rose-500 transition-colors disabled:opacity-30"
                            >
                                {clearing ? 'Очистка...' : 'Очистить'}
                            </button>
                        )}
                </div>
                <div className="space-y-2">
                    <button
                        onClick={() => setSelectedVersion(null)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all group ${
                            !selectedVersion
                                ? 'bg-foreground border-foreground text-background shadow-xl'
                                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest">
                                    Текущая версия
                                </p>
                                <p
                                    className={`text-[9px] font-bold opacity-40 ${!selectedVersion ? 'text-background' : 'text-foreground'}`}
                                >
                                    v{calculation.version_number || 1} • Актуально
                                </p>
                            </div>
                            <div className="text-right">
                                <p
                                    className={`text-xs font-black ${!selectedVersion ? 'text-background' : 'text-primary'}`}
                                >
                                    {currentEntity.totalCost.toLocaleString('ru-RU')} ₽
                                </p>
                                <ChevronRight
                                    size={16}
                                    className={`ml-auto mt-1 ${!selectedVersion ? 'text-primary' : 'text-foreground/20'}`}
                                />
                            </div>
                        </div>
                    </button>

                    {filteredVersions.map((v, i) => {
                        const prevVersion = filteredVersions[i + 1];
                        const currentCost = getVersionCost(v);
                        const prevCost = prevVersion ? getVersionCost(prevVersion) : null;

                        let delta = null;
                        if (prevCost && prevCost > 0) {
                            delta = ((currentCost - prevCost) / prevCost) * 100;
                        }

                        return (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVersion(v)}
                                className={`w-full p-5 rounded-2xl border text-left transition-all group ${
                                    selectedVersion?.id === v.id
                                        ? 'bg-foreground border-foreground text-background shadow-xl'
                                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest">
                                                Версия v{v.version_number}
                                            </p>
                                            <div
                                                className={`flex items-center gap-2 text-[9px] font-bold opacity-40 ${selectedVersion?.id === v.id ? 'text-background' : 'text-foreground'}`}
                                            >
                                                <Clock size={10} />
                                                {new Date(v.created_at).toLocaleDateString(
                                                    'ru-RU',
                                                    {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    }
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <p
                                                    className={`text-xs font-black ${selectedVersion?.id === v.id ? 'text-background' : 'text-foreground'}`}
                                                >
                                                    {currentCost.toLocaleString('ru-RU')} ₽
                                                </p>
                                                {delta !== null && (
                                                    <span
                                                        className={`text-[9px] font-black ${
                                                            delta > 0
                                                                ? 'text-rose-500'
                                                                : delta < 0
                                                                  ? 'text-emerald-500'
                                                                  : 'text-foreground/20'
                                                        } ${selectedVersion?.id === v.id ? '!text-background/60' : ''}`}
                                                    >
                                                        {delta > 0 ? '↑' : '↓'}{' '}
                                                        {Math.abs(delta).toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {v.change_reason && (
                                        <div
                                            className={`pl-3 border-l-2 py-1 ${
                                                selectedVersion?.id === v.id
                                                    ? 'border-background/20 text-background/60'
                                                    : 'border-primary/20 text-foreground/40'
                                            }`}
                                        >
                                            <p className="text-[10px] font-bold leading-relaxed italic">
                                                {v.change_reason}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Diff Viewer */}
            <div className="lg:col-span-8 space-y-6">
                {!selectedVersion ? (
                    <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6 border-dashed border-white/10">
                        <div className="w-20 h-20 bg-primary/5 text-primary rounded-[40px] flex items-center justify-center animate-pulse">
                            <ArrowRight size={32} />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-black italic">Выберите версию слева</p>
                            <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest leading-relaxed">
                                Чтобы увидеть отличия текущего расчета <br /> от предыдущего
                                состояния
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">
                                Анализ изменений
                            </h3>
                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-tighter">
                                <div className="flex items-center gap-1.5 text-emerald-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Добавлено: {diff?.added.length}
                                </div>
                                <div className="flex items-center gap-1.5 text-rose-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Удалено: {diff?.removed.length}
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-500">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Изменено:{' '}
                                    {diff ? diff.modified.length + diff.replaced.length : 0}
                                </div>
                                {diff?.adjustments && diff.adjustments.length > 0 && (
                                    <div className="flex items-center gap-1.5 text-amber-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                        Финансы: {diff.adjustments.length}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-10">
                            {/* TOTAL IMPACT SUMMARY */}
                            {selectedVersion && (
                                <div className="p-8 rounded-[2.5rem] bg-foreground border border-foreground text-background flex items-center justify-between shadow-2xl">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                            Финансовый итог версии
                                        </h4>
                                        <p className="text-3xl font-black tracking-tighter">
                                            {getVersionCost(selectedVersion).toLocaleString(
                                                'ru-RU'
                                            )}{' '}
                                            ₽
                                        </p>
                                    </div>
                                    {selectedIdx < filteredVersions.length - 1 && (
                                        <div className="text-right space-y-1">
                                            {(() => {
                                                const currentCost = getVersionCost(selectedVersion);
                                                const prevVersion =
                                                    filteredVersions[selectedIdx + 1];
                                                const prevCost = getVersionCost(prevVersion);
                                                const verDelta =
                                                    prevCost > 0
                                                        ? ((currentCost - prevCost) / prevCost) *
                                                          100
                                                        : 0;

                                                return (
                                                    <>
                                                        <span
                                                            className={`text-xl font-black ${verDelta > 0 ? 'text-rose-400' : verDelta < 0 ? 'text-emerald-400' : 'opacity-40'}`}
                                                        >
                                                            {verDelta > 0
                                                                ? '↑'
                                                                : verDelta < 0
                                                                  ? '↓'
                                                                  : ''}{' '}
                                                            {Math.abs(verDelta).toFixed(1)}%
                                                        </span>
                                                        <p className="text-[9px] font-bold opacity-40 italic uppercase tracking-tighter">
                                                            Изменение к v
                                                            {prevVersion.version_number}
                                                        </p>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-3">
                                {diff?.adjustments?.map((adj: VersionAdjustment, idx: number) => (
                                    <div
                                        key={`adj-${idx}`}
                                        className="p-5 rounded-3xl border bg-amber-500/5 border-amber-500/10 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                                                <Settings size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-widest">
                                                    {adj.field === 'global_margin'
                                                        ? 'Глобальная наценка'
                                                        : adj.field === 'delivery_cost'
                                                          ? 'Стоимость доставки'
                                                          : adj.field === 'service_cost'
                                                            ? 'Дополнительные услуги'
                                                            : adj.field}
                                                </p>
                                                <p className="text-[9px] font-bold text-foreground/40 italic">
                                                    Параметр ценообразования изменен экспертом
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold line-through opacity-20">
                                                {adj.field === 'global_margin'
                                                    ? `x${adj.old}`
                                                    : `${adj.old}₽`}
                                            </span>
                                            <ArrowRight size={14} className="text-amber-500" />
                                            <span className="text-[11px] font-black text-amber-500 font-mono">
                                                {adj.field === 'global_margin'
                                                    ? `x${adj.new}`
                                                    : `${adj.new}₽`}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {diff?.replaced.map((pair, idx) => (
                                    <div
                                        key={`rep-${idx}`}
                                        className="p-5 rounded-3xl border bg-blue-500/5 border-blue-500/10 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center">
                                                <History size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-widest">
                                                    Замена товара
                                                </p>
                                                <p className="text-[9px] font-bold text-foreground/40 italic">
                                                    Позиция заменена экспертом на аналог
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold line-through opacity-20">
                                                {pair.oldItem.inventory}
                                            </span>
                                            <ArrowRight size={14} className="text-blue-500" />
                                            <span className="text-[11px] font-black text-blue-500">
                                                {pair.newItem.inventory}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {diff?.added.map((item, idx) => (
                                    <DiffItemRow key={`add-${idx}`} type="added" item={item} />
                                ))}
                                {diff?.modified.map((mod, idx) => (
                                    <DiffItemRow
                                        key={`mod-${idx}`}
                                        type="modified"
                                        item={mod.item}
                                        oldQty={mod.oldQuantity}
                                        newQty={mod.newQuantity}
                                        oldPrice={mod.oldPrice}
                                        newPrice={mod.newPrice}
                                    />
                                ))}
                                {diff?.removed.map((item, idx) => (
                                    <DiffItemRow key={`rem-${idx}`} type="removed" item={item} />
                                ))}
                            </div>

                            {diff?.added.length === 0 &&
                                diff?.removed.length === 0 &&
                                diff?.modified.length === 0 &&
                                diff?.adjustments.length === 0 &&
                                diff?.replaced.length === 0 && (
                                    <div className="p-10 border border-white/5 rounded-3xl text-center bg-white/[0.01]">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">
                                            Изменений в составе или параметрах не обнаружено
                                        </p>
                                    </div>
                                )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const DiffItemRow: React.FC<{
    type: 'added' | 'removed' | 'modified';
    item: InventoryItem;
    oldQty?: number;
    newQty?: number;
    oldPrice?: number;
    newPrice?: number;
}> = ({ type, item, oldQty, newQty, oldPrice, newPrice }) => {
    const isAdded = type === 'added';
    const isRemoved = type === 'removed';
    const isModified = type === 'modified';

    return (
        <div
            className={`p-5 rounded-3xl border transition-all ${
                isAdded
                    ? 'bg-emerald-500/5 border-emerald-500/10'
                    : isRemoved
                      ? 'bg-rose-500/5 border-rose-500/10 grayscale opacity-60'
                      : 'bg-blue-500/5 border-blue-500/10'
            }`}
        >
            <div className="flex items-center gap-5">
                <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        isAdded
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : isRemoved
                              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                              : 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    }`}
                >
                    {isAdded ? (
                        <Plus size={20} />
                    ) : isRemoved ? (
                        <Minus size={20} />
                    ) : (
                        <Edit3 size={20} />
                    )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black uppercase tracking-widest truncate">
                            {item.inventory}
                        </span>
                        {item.sku && (
                            <span className="text-[8px] font-black text-foreground/50 border border-white/5 px-1.5 py-0.5 rounded italic">
                                {item.sku}
                            </span>
                        )}
                    </div>
                    <p className="text-[9px] font-bold text-foreground/40 italic">
                        {isAdded
                            ? 'Товар добавлен экспертом в план снабжения'
                            : isRemoved
                              ? 'Товар исключен из плана снабжения'
                              : 'Изменены количественные или ценовые параметры'}
                    </p>
                </div>

                <div className="flex items-center gap-8 shrink-0">
                    {/* Quantity Diff */}
                    <div className="text-right space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-tighter text-foreground/50">
                            Количество
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                            {isModified && oldQty !== undefined && newQty !== undefined && (
                                <>
                                    <span className="text-[10px] font-bold line-through opacity-20">
                                        {oldQty} {item.unit}
                                    </span>
                                    <ArrowRight size={10} className="text-blue-500" />
                                    <span className="text-[11px] font-black text-blue-500">
                                        {newQty} {item.unit}
                                    </span>
                                </>
                            )}
                            {isAdded && (
                                <span className="text-[11px] font-black text-emerald-500">
                                    {item.quantity} {item.unit}
                                </span>
                            )}
                            {isRemoved && (
                                <span className="text-[11px] font-black text-rose-500">
                                    {item.quantity} {item.unit}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Price Diff */}
                    <div className="text-right space-y-1 w-24">
                        <p className="text-[8px] font-black uppercase tracking-tighter text-foreground/50">
                            Цена за ед.
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                            {isModified && oldPrice !== undefined && newPrice !== undefined && (
                                <>
                                    <span className="text-[10px] font-bold line-through opacity-20">
                                        {oldPrice}₽
                                    </span>
                                    <ArrowRight size={10} className="text-blue-500" />
                                    <span className="text-[11px] font-black text-blue-500">
                                        {newPrice}₽
                                    </span>
                                </>
                            )}
                            {isAdded && (
                                <span className="text-[11px] font-black text-emerald-500">
                                    {item.price}₽
                                </span>
                            )}
                            {isRemoved && (
                                <span className="text-[11px] font-black text-rose-500">
                                    {item.price}₽
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
