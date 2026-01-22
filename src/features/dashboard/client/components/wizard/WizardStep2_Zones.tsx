import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Ruler, Plus, Layout, Trash2, AlertCircle, X } from 'lucide-react';
import { ZONE_TYPES, type CalculationResults } from '@/features/dashboard/dashboard.types';
import { getTotalZonesArea } from '@/core/domain/calculator.utils';
import type { ObjectData } from './useCalculationWizard';
import type { Zone } from '@/features/dashboard/dashboard.types';

interface WizardStep2Props {
    objectData: ObjectData;
    zones: Zone[];
    onBackToStep1: () => void;
    onAddZone: (data: Partial<Zone> & { type: string; area: string; color: string }) => void;
    onDeleteZone: (id: string | number) => void;
    onCalculate: () => void;
    showModal: boolean;
    setShowModal: (vals: boolean) => void;
    results?: CalculationResults | null; // Make optional to avoid breaking immediately? No, making it optional is safer.
}

export const WizardStep2_Zones: React.FC<WizardStep2Props> = ({
    objectData,
    zones,
    onBackToStep1,
    onAddZone,
    onDeleteZone,
    onCalculate,
    showModal,
    setShowModal,
    results,
}) => {
    const totalZonesArea = getTotalZonesArea(zones);
    const hasAreaWarning =
        !!objectData.totalArea && totalZonesArea > parseFloat(objectData.totalArea);

    // Local state for the modal form
    const [currentZone, setCurrentZone] = useState({
        type: '',
        area: '',
        staffCount: '',
        color: '',
    });

    // NOTE: Scroll lock is handled by parent NewCalculationWizard via overflow-hidden class
    // when showModal is true. No need to manipulate body styles here.

    const handleAddClick = () => {
        if (currentZone.type && currentZone.area) {
            onAddZone(currentZone);
            setCurrentZone({ type: '', area: '', staffCount: '', color: '' });
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="adaptive-columns">
                <div className="w-full">
                    <div className="glass-card flex flex-wrap items-center justify-between gap-fluid border-primary/10 p-fluid">
                        <div
                            className="space-y-2 text-center"
                            style={{ textAlign: 'inherit' } as React.CSSProperties}
                        >
                            <h2 className="text-fluid-xl font-black tracking-tight flex flex-wrap items-center justify-center gap-4">
                                {objectData.name}
                                <button
                                    onClick={onBackToStep1}
                                    className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group/edit"
                                    title="Изменить название или метраж"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </h2>
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                <span className="text-fluid-xs font-black text-primary bg-primary/10 px-4 py-1.5 rounded-full uppercase tracking-widest border border-primary/20">
                                    {objectData.type}
                                </span>
                                <div className="flex items-center gap-2 text-foreground/40 text-fluid-xs font-black uppercase tracking-widest">
                                    <Ruler className="w-4 h-4" /> {objectData.totalArea} м²
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-premium flex-grow max-w-full"
                        >
                            <Plus className="w-5 h-5" /> Добавить зону
                        </button>
                    </div>
                </div>

                <div className="adaptive-main space-y-6">
                    {zones.length === 0 ? (
                        <div className="glass-card py-32 border-dashed flex flex-col items-center justify-center gap-6">
                            <div className="w-20 h-20 bg-card rounded-[2rem] flex items-center justify-center text-foreground/10">
                                <Layout size={40} />
                            </div>
                            <p className="text-[10px] font-black text-foreground/50 uppercase tracking-[0.3em]">
                                Зоны еще не определены
                            </p>
                        </div>
                    ) : (
                        <div className="adaptive-grid gap-6">
                            {zones.map((zone) => (
                                <div
                                    key={zone.id}
                                    className="glass-card relative overflow-hidden group"
                                >
                                    <div
                                        className="absolute top-0 left-0 w-2 h-full"
                                        style={{ backgroundColor: zone.color }}
                                    />
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-foreground/50 uppercase tracking-[0.3em]">
                                                Параметры зоны
                                            </p>
                                            <h3 className="text-xl font-black leading-none">
                                                {zone.name}
                                            </h3>
                                            <div className="flex items-center gap-2 bg-card border border-border-theme px-3 py-1.5 rounded-xl w-fit">
                                                <Ruler className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[11px] font-black uppercase tracking-widest">
                                                    {zone.area} м²
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onDeleteZone(zone.id)}
                                            className="w-10 h-10 rounded-xl bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="adaptive-sidebar sticky top-24 h-fit">
                    <div className="glass-card !bg-foreground !text-background space-y-10">
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-background/40 uppercase tracking-[0.3em]">
                                Сводная информация
                            </p>
                            <div className="space-y-8">
                                <div className="flex items-end justify-between border-b border-background/10 pb-4">
                                    <p className="text-fluid-xs font-black text-primary uppercase tracking-widest">
                                        Количество зон
                                    </p>
                                    <p className="text-fluid-xl font-black">{zones.length}</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <p className="text-fluid-xs font-black text-primary uppercase tracking-widest">
                                            Площадь покрытия
                                        </p>
                                        <div className="text-right">
                                            <span
                                                className={`text-fluid-xl font-black ${hasAreaWarning ? 'text-red-400' : 'text-background'}`}
                                            >
                                                {totalZonesArea.toFixed(1)}
                                            </span>
                                            <span className="text-fluid-xs font-bold text-background/30 block mt-1">
                                                ИЗ {objectData.totalArea} м²
                                            </span>
                                        </div>
                                    </div>
                                    {hasAreaWarning && (
                                        <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl flex items-center gap-3 border border-red-500/20">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">
                                                Превышена общая площадь объекта на{' '}
                                                {(
                                                    totalZonesArea -
                                                    parseFloat(objectData.totalArea)
                                                ).toFixed(1)}{' '}
                                                м²
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Real-time Budget Estimation */}
                        {results && results.summary.length > 0 && (
                            <div className="space-y-6 pt-6 border-t border-background/10 animate-in fade-in duration-700">
                                <p className="text-[10px] font-black text-background/40 uppercase tracking-[0.3em]">
                                    Предварительный расчет
                                </p>
                                <div className="space-y-4">
                                    <div className="group p-4 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors space-y-2 cursor-help relative">
                                        <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest">
                                            Итого с НДС
                                        </p>
                                        <p className="text-fluid-xl font-black text-white tracking-tight">
                                            {((results.grandTotal || 0) * 0.95).toLocaleString(
                                                'ru-RU',
                                                { maximumFractionDigits: 0 }
                                            )}
                                            <span className="text-primary mx-1">-</span>
                                            {((results.grandTotal || 0) * 1.05).toLocaleString(
                                                'ru-RU',
                                                { maximumFractionDigits: 0 }
                                            )}
                                            <span className="text-sm text-white/40 ml-1">₽</span>
                                        </p>
                                        <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-white/10 p-3 rounded-lg -top-24 left-0 w-64 shadow-2xl z-50 pointer-events-none">
                                            <div className="flex justify-between text-[10px] text-white/60 mb-1">
                                                <span>Товары:</span>
                                                <span>
                                                    {(results.totalGoods || 0).toLocaleString()} ₽
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-white/60 mb-1">
                                                <span>Доставка:</span>
                                                <span>
                                                    {(results.totalDelivery || 0).toLocaleString()}{' '}
                                                    ₽
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-emerald-400 font-bold border-t border-white/10 pt-1 mt-1">
                                                <span>НДС 20%:</span>
                                                <span>
                                                    {(results.totalVat || 0).toLocaleString()} ₽
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 px-2">
                                        <div className="flex justify-between items-center text-[10px] text-background/60">
                                            <span>Товары</span>
                                            <span className="font-bold">
                                                {(results.totalGoods || 0).toLocaleString()} ₽
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-background/60">
                                            <span>Доставка (Авто)</span>
                                            <span className="font-bold whitespace-nowrap">
                                                {(results.totalDelivery || 0).toLocaleString()} ₽
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={onCalculate}
                                disabled={zones.length === 0 || hasAreaWarning}
                                className="btn-premium w-full !bg-background !text-foreground hover:!bg-primary hover:!text-white disabled:opacity-20 relative overflow-hidden group"
                            >
                                {hasAreaWarning && (
                                    <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center backdrop-blur-[1px] text-red-500 z-10">
                                        <span className="bg-white px-2 py-1 rounded text-[10px]">
                                            Площадь превышена!
                                        </span>
                                    </div>
                                )}
                                Сформировать расчет
                            </button>
                            <button
                                onClick={onBackToStep1}
                                className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-background/40 hover:text-background transition-colors"
                            >
                                Вернуться назад
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] animate-in fade-in duration-300 flex items-center justify-center p-fluid bg-background/80 backdrop-blur-xl"
                        onClick={() => {
                            setShowModal(false);
                            setCurrentZone({ type: '', area: '', staffCount: '', color: '' });
                        }}
                    >
                        <div
                            className="relative w-full max-h-full max-w-md overflow-y-auto bg-background/90 backdrop-blur-xl glass-card shadow-3xl p-fluid cursor-auto animate-in slide-in-from-bottom-10 zoom-in-95 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setCurrentZone({
                                        type: '',
                                        area: '',
                                        staffCount: '',
                                        color: '',
                                    });
                                }}
                                className="absolute top-4 left-4 p-2 rounded-xl text-foreground/20 hover:text-foreground hover:bg-foreground/5 transition-all z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="text-center mb-fluid">
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                                    <Layout size={28} />
                                </div>
                                <h3 className="text-fluid-lg font-black tracking-tight">
                                    Добавить помещение
                                </h3>
                                <p className="text-fluid-xs font-black text-foreground/50 uppercase tracking-[0.3em] mt-2">
                                    Параметры рабочей зоны
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-fluid-xs font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">
                                        Тип зоны
                                    </label>
                                    <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
                                        {ZONE_TYPES.map((type) => (
                                            <button
                                                key={type.value}
                                                onClick={() =>
                                                    setCurrentZone({
                                                        ...currentZone,
                                                        type: type.value,
                                                        color: type.color,
                                                    })
                                                }
                                                className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                                                    currentZone.type === type.value
                                                        ? 'bg-foreground border-foreground text-background shadow-xl'
                                                        : 'bg-card border-transparent text-foreground/40 hover:border-border-theme'
                                                }`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">
                                            Площадь (м²)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={currentZone.area}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (
                                                    e.target.value === '' ||
                                                    (!isNaN(val) && val >= 0)
                                                ) {
                                                    setCurrentZone({
                                                        ...currentZone,
                                                        area: e.target.value,
                                                    });
                                                }
                                            }}
                                            className="input-premium"
                                            placeholder="50"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">
                                            Персонал в зоне
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={currentZone.staffCount}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (
                                                    e.target.value === '' ||
                                                    (!isNaN(val) && val >= 0)
                                                ) {
                                                    setCurrentZone({
                                                        ...currentZone,
                                                        staffCount: e.target.value,
                                                    });
                                                }
                                            }}
                                            className="input-premium"
                                            placeholder="5"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex flex-col gap-3">
                                <button
                                    onClick={handleAddClick}
                                    disabled={!currentZone.type || !currentZone.area}
                                    className="btn-premium w-full"
                                >
                                    Зафиксировать зону
                                </button>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setCurrentZone({
                                            type: '',
                                            area: '',
                                            staffCount: '',
                                            color: '',
                                        });
                                    }}
                                    className="w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 hover:text-foreground transition-colors"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};
