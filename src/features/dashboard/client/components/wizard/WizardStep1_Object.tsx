import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { SANITARY_LEVELS, INTENSITY_LEVELS } from '@/features/dashboard/dashboard.types';
import { getTotalZonesStaff } from '@/core/domain/calculator.utils';
import type { Venue } from '@/services/venue.service';
import type { ObjectData } from './useCalculationWizard';
import type { Zone } from '@/features/dashboard/dashboard.types';
import { VenueSelector } from '@/features/calculator/components/VenueSelector';
import { ObjectBasicSpecs } from '@/features/calculator/components/ObjectBasicSpecs';

interface WizardStep1Props {
    objectData: ObjectData;
    setObjectData: (data: ObjectData) => void;
    venues: Venue[];
    onVenueSelect: (id: string) => void;
    onNext: () => void;
    zones: Zone[];
}

export const WizardStep1_Object: React.FC<WizardStep1Props> = ({
    objectData,
    setObjectData,
    venues,
    onVenueSelect,
    onNext,
    zones,
}) => {
    // Computed logic
    const totalZonesStaff = getTotalZonesStaff(zones);

    return (
        <div className="glass-card centered-content p-fluid space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="space-y-10">
                <div className="space-y-6">
                    <h3 className="text-fluid-xs font-black uppercase tracking-[0.3em] text-primary border-b border-primary/10 pb-4">
                        Характеристики объекта
                    </h3>

                    <VenueSelector
                        venues={venues}
                        selectedVenueId={objectData.selectedVenueId}
                        onSelect={onVenueSelect}
                    />

                    <ObjectBasicSpecs
                        data={{
                            type: objectData.type,
                            totalArea: objectData.totalArea,
                            staffCount:
                                zones.length > 0
                                    ? totalZonesStaff.toString()
                                    : objectData.staffCount,
                            dailyVisitors: objectData.dailyVisitors,
                        }}
                        onChange={(updates) => setObjectData({ ...objectData, ...updates })}
                    />

                    {zones.length > 0 && (
                        <p className="text-[10px] font-bold text-primary/50 uppercase tracking-widest mt-[-20px] ml-1 animate-pulse italic">
                            * Персонал рассчитан автоматически по зонам
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-8">
                    <div className="space-y-6">
                        <h3 className="text-fluid-xs font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">
                            Уровень санитарии
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {SANITARY_LEVELS.map((level) => (
                                <button
                                    key={level.value}
                                    onClick={() =>
                                        setObjectData({ ...objectData, sanitaryLevel: level.value })
                                    }
                                    className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                                        objectData.sanitaryLevel === level.value
                                            ? 'bg-foreground border-foreground text-background shadow-xl'
                                            : 'bg-card border-transparent hover:border-border-theme'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <p
                                            className={`text-fluid-xs font-black uppercase tracking-widest ${objectData.sanitaryLevel === level.value ? 'text-primary' : 'text-foreground'}`}
                                        >
                                            {level.label.split(' (')[0]}
                                        </p>
                                        <p
                                            className={`text-[9px] font-bold opacity-40 ${objectData.sanitaryLevel === level.value ? 'text-background' : 'text-foreground'}`}
                                        >
                                            {level.label.split(' (')[1]?.replace(')', '')}
                                        </p>
                                    </div>
                                    {objectData.sanitaryLevel === level.value && (
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-fluid-xs font-black uppercase tracking-[0.2em] text-foreground/40 ml-1">
                            Интенсивность нагрузки
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {INTENSITY_LEVELS.map((level) => (
                                <button
                                    key={level.value}
                                    onClick={() =>
                                        setObjectData({
                                            ...objectData,
                                            intensityLevel: level.value,
                                        })
                                    }
                                    className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group ${
                                        objectData.intensityLevel === level.value
                                            ? 'bg-foreground border-foreground text-background shadow-xl'
                                            : 'bg-card border-transparent hover:border-border-theme'
                                    }`}
                                >
                                    <div className="space-y-1">
                                        <p
                                            className={`text-fluid-xs font-black uppercase tracking-widest ${objectData.intensityLevel === level.value ? 'text-primary' : 'text-foreground'}`}
                                        >
                                            {level.label}
                                        </p>
                                        <p
                                            className={`text-[9px] font-bold opacity-40 ${objectData.intensityLevel === level.value ? 'text-background' : 'text-foreground'}`}
                                        >
                                            Коэффициент: {level.coeff.toFixed(1)}x
                                        </p>
                                    </div>
                                    {objectData.intensityLevel === level.value && (
                                        <CheckCircle2 className="w-5 h-5 text-primary" />
                                    )}
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
