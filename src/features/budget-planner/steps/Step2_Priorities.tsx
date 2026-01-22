import React, { useState } from 'react';
import { Ruler, Plus, Layout, Trash2, ArrowRight, ChevronLeft, Star } from 'lucide-react';
import { ZONE_TYPES } from '@/features/dashboard/dashboard.types';
import { type ZoneWithPriority, type PriorityLevel } from '@/core/domain/budget/budget.types';

interface Step2Props {
    zones: ZoneWithPriority[];
    onAddZone: (type: string) => void;
    onUpdatePriority: (id: string | number, priority: PriorityLevel) => void;
    onUpdateArea: (id: string | number, area: string) => void;
    onRemoveZone: (id: string | number) => void;
    onNext: () => void;
    onPrev: () => void;
    totalObjectArea: string;
    isEmbedMode?: boolean;
}

export const Step2_Priorities: React.FC<Step2Props> = ({
    zones,
    onAddZone,
    onUpdatePriority,
    onUpdateArea,
    onRemoveZone,
    onNext,
    onPrev,
    totalObjectArea,
    isEmbedMode = false,
}) => {
    const [showTypeSelector, setShowTypeSelector] = useState(false);

    const totalZonesArea = zones.reduce((sum, z) => sum + (parseFloat(z.area) || 0), 0);

    const hasInvalidArea = zones.some((z) => !parseFloat(z.area) || parseFloat(z.area) <= 0);

    return (
        <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
            {/* ... Header stays same ... */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
                <button
                    onClick={onPrev}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 hover:text-primary transition-all group w-fit"
                >
                    <ChevronLeft
                        size={16}
                        className="group-hover:-translate-x-1 transition-transform"
                    />{' '}
                    Назад
                </button>
                <div
                    className={`flex items-center gap-4 px-6 py-3 rounded-2xl border shrink-0 transition-colors ${
                        hasInvalidArea
                            ? 'bg-red-500/10 border-red-500/20 animate-pulse'
                            : isEmbedMode
                              ? 'bg-white border-slate-200 shadow-sm'
                              : 'bg-white/5 backdrop-blur-md border-white/10'
                    }`}
                >
                    <div className="text-right">
                        <p
                            className={`text-[8px] font-black uppercase tracking-widest leading-none mb-1 ${hasInvalidArea ? 'text-red-500' : isEmbedMode ? 'text-slate-400' : 'text-foreground/20'}`}
                        >
                            {hasInvalidArea ? 'Требуется внимание' : 'Заполнено площади'}
                        </p>
                        <p
                            className={`text-sm font-black leading-none ${totalZonesArea > parseFloat(totalObjectArea) ? 'text-orange-500' : hasInvalidArea ? 'text-red-500' : 'text-primary'}`}
                        >
                            {totalZonesArea.toFixed(1)} / {totalObjectArea} м²
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 sm:gap-12">
                <div className="xl:col-span-8 space-y-8">
                    {/* ... (Type selector logic same) ... */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
                        <div className="space-y-1">
                            <h3 className="text-2xl sm:text-4xl font-black tracking-tighter">
                                Рабочие <span className="text-primary italic">зоны</span>
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30 leading-none">
                                Укажите площадь и важность каждой зоны
                            </p>
                        </div>
                        <button
                            onClick={() => setShowTypeSelector(!showTypeSelector)}
                            className="bg-primary text-white px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                        >
                            <Plus
                                size={18}
                                className="group-hover:rotate-90 transition-transform"
                            />{' '}
                            Добавить зону
                        </button>
                    </div>

                    {showTypeSelector && (
                        <div
                            className={`glass-card p-6 sm:p-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 animate-in zoom-in-95 duration-500 rounded-[40px] shadow-2xl ${
                                isEmbedMode
                                    ? 'bg-white border-slate-100 shadow-xl/10'
                                    : '!bg-white/10 backdrop-blur-3xl border-primary/20'
                            }`}
                        >
                            {ZONE_TYPES.map((t) => (
                                <button
                                    key={t.value}
                                    onClick={() => {
                                        onAddZone(t.value);
                                        setShowTypeSelector(false);
                                    }}
                                    className={`p-4 sm:p-6 rounded-3xl border text-center space-y-3 transition-all group/btn ${
                                        isEmbedMode
                                            ? 'border-slate-100 hover:border-primary hover:bg-primary/5 bg-slate-50'
                                            : 'border-white/5 hover:border-primary hover:bg-primary/5'
                                    }`}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full mx-auto shadow-lg group-hover/btn:scale-125 transition-transform"
                                        style={{ backgroundColor: t.color }}
                                    />
                                    <p className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis">
                                        {t.label}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="space-y-6">
                        {zones.length === 0 ? (
                            <div
                                className={`glass-card py-24 border-dashed border-2 flex flex-col items-center justify-center rounded-[40px] ${
                                    isEmbedMode
                                        ? 'bg-white border-slate-200 text-slate-400'
                                        : 'border-white/5 text-foreground/5'
                                }`}
                            >
                                <Layout size={64} strokeWidth={1} />
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-8 opacity-50">
                                    Пустота требует заполнения
                                </p>
                            </div>
                        ) : (
                            zones.map((zone) => {
                                const isZoneInvalid =
                                    !parseFloat(zone.area) || parseFloat(zone.area) <= 0;
                                return (
                                    <div
                                        key={zone.id}
                                        className={`glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-10 group relative transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-[32px] ${
                                            isZoneInvalid
                                                ? 'border-red-500/30 bg-red-500/5'
                                                : isEmbedMode
                                                  ? 'bg-white border-slate-100 shadow-lg/5 hover:border-primary/20'
                                                  : 'hover:border-white/20'
                                        }`}
                                    >
                                        <div
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 rounded-r-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)]"
                                            style={{ backgroundColor: zone.color }}
                                        />

                                        <div className="flex-1 w-full sm:w-auto space-y-4 sm:space-y-2">
                                            <h4 className="font-black text-xl uppercase tracking-tighter text-center sm:text-left">
                                                {zone.name}
                                            </h4>
                                            <div className="flex items-center justify-center sm:justify-start gap-4">
                                                <div
                                                    className={`flex items-center gap-3 px-4 py-2 rounded-2xl border transition-colors ${
                                                        isZoneInvalid
                                                            ? 'bg-red-500/10 border-red-500/30'
                                                            : isEmbedMode
                                                              ? 'bg-slate-50 border-slate-200'
                                                              : 'bg-white/5 border-white/5'
                                                    }`}
                                                >
                                                    <Ruler
                                                        size={14}
                                                        className={
                                                            isZoneInvalid
                                                                ? 'text-red-500'
                                                                : 'text-primary'
                                                        }
                                                    />
                                                    <input
                                                        type="number"
                                                        min="0.1"
                                                        value={zone.area}
                                                        onChange={(e) => {
                                                            onUpdateArea(zone.id, e.target.value);
                                                        }}
                                                        className={`bg-transparent border-none p-0 text-sm font-black w-14 sm:w-20 outline-none focus:ring-0 ${
                                                            isZoneInvalid
                                                                ? 'text-red-500'
                                                                : isEmbedMode
                                                                  ? 'text-slate-900 placeholder:text-slate-300'
                                                                  : 'text-white placeholder:text-white/10'
                                                        }`}
                                                        placeholder="0"
                                                    />
                                                    <span
                                                        className={`text-[10px] font-black uppercase opacity-20 ${isZoneInvalid ? 'text-red-500' : ''}`}
                                                    >
                                                        м²
                                                    </span>
                                                </div>
                                                {isZoneInvalid && (
                                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-wider animate-pulse">
                                                        Укажите площадь!
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
                                            <p
                                                className={`text-[8px] font-black uppercase tracking-[0.3em] ${isEmbedMode ? 'text-slate-400' : 'text-foreground/20'}`}
                                            >
                                                Преимущество
                                            </p>
                                            <div className="flex gap-2">
                                                {(
                                                    [
                                                        'low',
                                                        'standard',
                                                        'critical',
                                                    ] as PriorityLevel[]
                                                ).map((p) => (
                                                    <button
                                                        key={p}
                                                        onClick={() => onUpdatePriority(zone.id, p)}
                                                        className={`p-3 rounded-2xl transition-all duration-500 border ${
                                                            zone.priority === p
                                                                ? 'bg-primary border-primary text-white shadow-[0_8px_32px_rgba(var(--primary-rgb),0.3)] scale-110'
                                                                : isEmbedMode
                                                                  ? 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300'
                                                                  : 'bg-white/5 border-white/5 text-primary/40 hover:bg-white/10 hover:border-white/10'
                                                        }`}
                                                        title={p.toUpperCase()}
                                                    >
                                                        <Star
                                                            size={18}
                                                            fill={
                                                                zone.priority === p
                                                                    ? 'currentColor'
                                                                    : 'none'
                                                            }
                                                            className={
                                                                zone.priority === p
                                                                    ? 'animate-pulse'
                                                                    : ''
                                                            }
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => onRemoveZone(zone.id)}
                                            className="absolute top-2 right-2 sm:static sm:top-auto sm:right-auto p-3 rounded-2xl bg-transparent hover:bg-red-500/10 text-foreground/20 hover:text-red-500 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                                            title="Удалить зону"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="xl:col-span-4 space-y-8">
                    <div className="glass-card p-10 sm:p-12 !bg-white text-black space-y-10 sticky top-24 rounded-[48px] shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40 underline decoration-primary decoration-4 underline-offset-8">
                                Помощь эксперта
                            </h3>
                            <p className="text-lg font-bold leading-tight tracking-tight">
                                "Система <span className="text-primary italic">гармонизирует</span>{' '}
                                ваш бюджет. Зоны с наивысшим приоритетом будут укомплектованы в
                                первую очередь с бескомпромиссным качеством."
                            </p>
                        </div>

                        <div className="pt-10 border-t border-black/5 space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                    Критические зоны
                                </span>
                                <span className="text-3xl font-black tabular-nums">
                                    {zones.filter((z) => z.priority === 'critical').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                    Второстепенные
                                </span>
                                <span className="text-3xl font-black tabular-nums">
                                    {zones.filter((z) => z.priority !== 'critical').length}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={onNext}
                            disabled={
                                zones.length === 0 ||
                                hasInvalidArea ||
                                totalZonesArea > parseFloat(totalObjectArea)
                            }
                            className="w-full py-8 rounded-[2.5rem] bg-black text-white text-[14px] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-primary transition-all duration-500 disabled:opacity-20 disabled:grayscale group relative overflow-hidden"
                        >
                            {hasInvalidArea ? (
                                <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[1px] text-red-500 z-10">
                                    <span className="bg-white px-2 py-1 rounded text-[10px]">
                                        Заполните площади
                                    </span>
                                </div>
                            ) : totalZonesArea > parseFloat(totalObjectArea) ? (
                                <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[1px] text-red-500 z-10">
                                    <span className="bg-white px-2 py-1 rounded text-[10px]">
                                        Площадь превышена!
                                    </span>
                                </div>
                            ) : null}
                            Анализ бюджета{' '}
                            <ArrowRight
                                size={22}
                                className="inline ml-3 group-hover:translate-x-2 transition-transform"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
