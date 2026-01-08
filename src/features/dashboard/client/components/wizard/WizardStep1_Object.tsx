import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { OBJECT_TYPES, SANITARY_LEVELS, INTENSITY_LEVELS } from '@/features/dashboard/dashboard.types';
import { getTotalZonesStaff } from '@/core/domain/calculator.utils';
import type { Venue } from '@/services/venue.service';
import type { ObjectData } from './useCalculationWizard';
import type { Zone } from '@/features/dashboard/dashboard.types';

interface WizardStep1Props {
    objectData: ObjectData;
    setObjectData: (data: ObjectData) => void;
    venues: Venue[];
    onVenueSelect: (id: string) => void;
    onNext: () => void;
    zones: Zone[];
}

export const WizardStep1_Object: React.FC<WizardStep1Props> = ({
    objectData, setObjectData, venues, onVenueSelect, onNext, zones
}) => {
    // Computed logic
    const totalZonesStaff = getTotalZonesStaff(zones);

    return (
        <div className="glass-card max-w-xl mx-auto !p-6 sm:!p-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="space-y-10">
                <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary border-b border-primary/10 pb-4">Характеристики объекта</h3>

                    {venues.length > 0 && (
                        <div className="space-y-3 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em]">Выбрать из моих объектов</label>
                            </div>
                            <select
                                onChange={(e) => onVenueSelect(e.target.value)}
                                className="w-full bg-background border border-primary/20 rounded-2xl px-6 py-4 text-[13px] font-black focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                            >
                                <option value="">-- Выберите заведение --</option>
                                {venues.map(v => (
                                    <option key={v.id} value={v.id}>{v.name} ({v.total_area} м²)</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Тип объекта</label>
                        <select
                            value={objectData.type}
                            onChange={(e) => setObjectData({ ...objectData, type: e.target.value })}
                            className="input-premium appearance-none cursor-pointer"
                        >
                            <option value="">Выбрать тип...</option>
                            {OBJECT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Площадь (м²)</label>
                            <input
                                type="number"
                                value={objectData.totalArea}
                                onChange={(e) => setObjectData({ ...objectData, totalArea: e.target.value })}
                                className="input-premium"
                                placeholder="90"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Общее количество персонала</label>
                            <div className="relative group/staff">
                                <input
                                    type="number"
                                    value={zones.length > 0 ? totalZonesStaff : objectData.staffCount}
                                    onChange={(e) => setObjectData({ ...objectData, staffCount: e.target.value })}
                                    disabled={zones.length > 0}
                                    className={`input-premium ${zones.length > 0 ? 'bg-primary/5 border-primary/20 text-primary font-black' : ''}`}
                                    placeholder="55"
                                />
                                {zones.length > 0 && (
                                    <p className="text-[8px] font-bold text-primary/50 uppercase tracking-widest mt-2 ml-1 animate-pulse">
                                        Сумма всех сотрудников по всем зонам
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1">Среднее количество посетителей в день</label>
                        <div className="space-y-2">
                            <input
                                type="number"
                                value={objectData.dailyVisitors}
                                onChange={(e) => setObjectData({ ...objectData, dailyVisitors: e.target.value })}
                                className="input-premium"
                                placeholder="100"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">Уровень санитарии (HACCP)</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {SANITARY_LEVELS.map(level => (
                                <button
                                    key={level.value}
                                    onClick={() => setObjectData({ ...objectData, sanitaryLevel: level.value })}
                                    className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${objectData.sanitaryLevel === level.value
                                        ? 'bg-foreground border-foreground text-background shadow-xl'
                                        : 'bg-card border-transparent hover:border-border-theme'
                                        }`}
                                >
                                    <div className="space-y-1">
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${objectData.sanitaryLevel === level.value ? 'text-primary' : 'text-foreground'}`}>
                                            {level.label.split(' (')[0]}
                                        </p>
                                        <p className={`text-[9px] font-bold opacity-40 ${objectData.sanitaryLevel === level.value ? 'text-background' : 'text-foreground'}`}>
                                            {level.label.split(' (')[1]?.replace(')', '')}
                                        </p>
                                    </div>
                                    {objectData.sanitaryLevel === level.value && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">Интенсивность нагрузки (BICSc)</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {INTENSITY_LEVELS.map(level => (
                                <button
                                    key={level.value}
                                    onClick={() => setObjectData({ ...objectData, intensityLevel: level.value })}
                                    className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${objectData.intensityLevel === level.value
                                        ? 'bg-foreground border-foreground text-background shadow-xl'
                                        : 'bg-card border-transparent hover:border-border-theme'
                                        }`}
                                >
                                    <div className="space-y-1">
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${objectData.intensityLevel === level.value ? 'text-primary' : 'text-foreground'}`}>
                                            {level.label}
                                        </p>
                                        <p className={`text-[9px] font-bold opacity-40 ${objectData.intensityLevel === level.value ? 'text-background' : 'text-foreground'}`}>
                                            Коэффициент: {level.coeff.toFixed(1)}x
                                        </p>
                                    </div>
                                    {objectData.intensityLevel === level.value && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onNext}
                    disabled={!objectData.type || !objectData.totalArea}
                    className="btn-premium w-full"
                >
                    Продолжить настройку <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
