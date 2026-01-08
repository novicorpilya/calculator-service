import React, { useState } from 'react';
import { Pencil, Ruler, Plus, Layout, Trash2, AlertCircle } from 'lucide-react';
import { ZONE_TYPES } from '@/features/dashboard/dashboard.types';
import type { ObjectData } from './useCalculationWizard';
import type { Zone } from '@/features/dashboard/dashboard.types';

interface WizardStep2Props {
    objectData: ObjectData;
    zones: Zone[];
    onBackToStep1: () => void;
    onAddZone: (data: Partial<Zone> & { type: string, area: string, color: string }) => void;
    onDeleteZone: (id: string | number) => void;
    onCalculate: () => void;
    showModal: boolean;
    setShowModal: (vals: boolean) => void;
}

export const WizardStep2_Zones: React.FC<WizardStep2Props> = ({
    objectData, zones, onBackToStep1, onAddZone, onDeleteZone, onCalculate, showModal, setShowModal
}) => {
    const totalZonesArea = zones.reduce((sum, zone) => sum + parseFloat(zone.area || '0'), 0);
    const hasAreaWarning = objectData.totalArea && totalZonesArea > parseFloat(objectData.totalArea);

    // Local state for the modal form
    const [currentZone, setCurrentZone] = useState({ type: '', area: '', staffCount: '', color: '' });

    const handleAddClick = () => {
        if (currentZone.type && currentZone.area) {
            onAddZone(currentZone);
            setCurrentZone({ type: '', area: '', staffCount: '', color: '' });
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    <div className="glass-card flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6 sm:gap-8 border-primary/10 !p-6 sm:!p-8">
                        <div className="space-y-2 text-center sm:text-left">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-4">
                                {objectData.name}
                                <button
                                    onClick={onBackToStep1}
                                    className="p-2 rounded-xl bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-sm group/edit"
                                    title="Изменить название или метраж"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            </h2>
                            <div className="flex items-center justify-center sm:justify-start gap-4">
                                <span className="text-[9px] sm:text-[10px] font-black text-primary bg-primary/10 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full uppercase tracking-widest border border-primary/20">
                                    {objectData.type}
                                </span>
                                <div className="flex items-center gap-2 text-foreground/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                    <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {objectData.totalArea} м²
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-premium w-full sm:w-auto"
                        >
                            <Plus className="w-5 h-5" /> Добавить зону
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-6">
                    {zones.length === 0 ? (
                        <div className="glass-card py-32 border-dashed flex flex-col items-center justify-center gap-6">
                            <div className="w-20 h-20 bg-card rounded-[2rem] flex items-center justify-center text-foreground/10">
                                <Layout size={40} />
                            </div>
                            <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.3em]">Зоны еще не определены</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-6">
                            {zones.map(zone => (
                                <div key={zone.id} className="glass-card relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: zone.color }} />
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-4">
                                            <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.3em]">Параметры зоны</p>
                                            <h3 className="text-xl font-black leading-none">{zone.name}</h3>
                                            <div className="flex items-center gap-2 bg-card border border-border-theme px-3 py-1.5 rounded-xl w-fit">
                                                <Ruler className="w-3.5 h-3.5 text-primary" />
                                                <span className="text-[11px] font-black uppercase tracking-widest">{zone.area} м²</span>
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

                <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
                    <div className="glass-card !bg-foreground !text-background space-y-10">
                        <div className="space-y-6">
                            <p className="text-[10px] font-black text-background/40 uppercase tracking-[0.3em]">Сводная информация</p>
                            <div className="space-y-8">
                                <div className="flex items-end justify-between border-b border-background/10 pb-4">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Количество зон</p>
                                    <p className="text-3xl font-black">{zones.length}</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-end justify-between">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Площадь покрытия</p>
                                        <div className="text-right">
                                            <span className={`text-3xl font-black ${hasAreaWarning ? 'text-red-400' : 'text-background'}`}>{totalZonesArea.toFixed(1)}</span>
                                            <span className="text-[10px] font-bold text-background/30 block mt-1">ИЗ {objectData.totalArea} м²</span>
                                        </div>
                                    </div>
                                    {hasAreaWarning && (
                                        <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl flex items-center gap-3 border border-red-500/20">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Превышена общая площадь объекта на {(totalZonesArea - parseFloat(objectData.totalArea)).toFixed(1)} м²</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={onCalculate}
                                disabled={zones.length === 0}
                                className="btn-premium w-full !bg-background !text-foreground hover:!bg-primary hover:!text-white disabled:opacity-20"
                            >
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

            {showModal && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 z-[100] animate-in fade-in duration-500">
                    <div className="glass-card max-w-md w-full scale-100 sm:scale-110 shadow-3xl animate-in zoom-in-95 duration-500 !p-6 sm:!p-10">
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-primary/10 text-primary rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                                <Layout size={28} />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Добавить помещение</h3>
                            <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.3em] mt-2">Параметры рабочей зоны</p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Тип зоны</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {ZONE_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            onClick={() => setCurrentZone({ ...currentZone, type: type.value, color: type.color })}
                                            className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${currentZone.type === type.value
                                                ? 'bg-foreground border-foreground text-background shadow-xl'
                                                : 'bg-card border-transparent text-foreground/40 hover:border-border-theme'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Площадь (м²)</label>
                                    <input
                                        type="number"
                                        value={currentZone.area}
                                        onChange={(e) => setCurrentZone({ ...currentZone, area: e.target.value })}
                                        className="input-premium"
                                        placeholder="50"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Персонал в зоне</label>
                                    <input
                                        type="number"
                                        value={currentZone.staffCount}
                                        onChange={(e) => setCurrentZone({ ...currentZone, staffCount: e.target.value })}
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
                                onClick={() => { setShowModal(false); setCurrentZone({ type: '', area: '', staffCount: '', color: '' }); }}
                                className="w-full py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 hover:text-foreground transition-colors"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
