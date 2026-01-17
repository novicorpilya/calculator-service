import React, { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { type Calculation, OBJECT_TYPES } from '../../dashboard.types';
import { getTotalZonesStaff } from '@/core/domain/calculator.utils';
import { useCalculationWizard } from './wizard/useCalculationWizard';
import { WizardStep1_Object } from './wizard/WizardStep1_Object';
import { WizardStep2_Zones } from './wizard/WizardStep2_Zones';
import { WizardStep3_Results } from './wizard/WizardStep3_Results';

interface NewCalculationWizardProps {
    onCancel: () => void;
    onComplete: (calculation: Calculation) => void | Promise<void>;
    initialData?: Calculation;
}

/**
 * Step-by-step wizard for creating new HoReCa inventory calculations.
 * Supports venue data auto-filling and real-time inventory forecasting.
 * Refactored to use modular components and custom hooks.
 */
export const NewCalculationWizard = React.memo<NewCalculationWizardProps>(
    ({ onCancel, onComplete, initialData }) => {
        const {
            step,
            setStep,
            objectData,
            setObjectData,
            zones,
            results,
            venues,
            handleVenueSelect,
            addZone,
            deleteZone,
            calculate,
            showZoneModal,
            setShowZoneModal,
            config,
        } = useCalculationWizard(initialData);

        const [isSubmitting, setIsSubmitting] = useState<'draft' | 'sent' | null>(null);

        const totalZonesStaff = getTotalZonesStaff(zones);

        const handleComplete = async (status: 'draft' | 'sent') => {
            if (isSubmitting || !results) return;
            setIsSubmitting(status);
            try {
                const selectedTypeLabel =
                    OBJECT_TYPES.find((t) => t.value === objectData.type)?.label || objectData.type;
                const newCalc: Calculation = {
                    id: initialData?.id || Date.now(),
                    organizationName: selectedTypeLabel,
                    type: objectData.type,
                    status: status,
                    zones: zones.map((z) => z.name),
                    zoneDetails: zones,
                    totalArea: parseFloat(objectData.totalArea),
                    zonesCount: zones.length,
                    staffCount:
                        zones.length > 0 ? totalZonesStaff : parseInt(objectData.staffCount || '0'),
                    dailyVisitors: parseInt(objectData.dailyVisitors || '0'),
                    sanitaryLevel: objectData.sanitaryLevel,
                    intensityLevel: objectData.intensityLevel,
                    replacementCycle: objectData.replacementCycle,
                    createdDate: initialData?.createdDate || new Date().toLocaleDateString('ru-RU'),
                    manager: initialData?.manager || 'Назначается',
                    comments: initialData?.comments || [],
                    unreadComments: initialData?.unreadComments || 0,
                    results: results,
                    calculator_config_snapshot: initialData?.calculator_config_snapshot || config,
                };
                await onComplete(newCalc);
            } finally {
                setIsSubmitting(null);
            }
        };

        return (
            <div
                className={`fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl px-6 py-12 sm:p-20 scrollbar-hide ${showZoneModal ? 'overflow-hidden' : 'overflow-y-auto'}`}
            >
                <div className="max-w-7xl mx-auto mb-10 sm:mb-20 flex justify-between items-start">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            {step > 1 ? (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="w-12 h-12 rounded-[1.2rem] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center group/back"
                                    title="Назад"
                                >
                                    <ArrowLeft className="w-5 h-5 group-hover/back:-translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <div className="w-12 h-12 rounded-[1.2rem] bg-foreground flex items-center justify-center">
                                    <span className="text-xl font-black text-background">
                                        {step}
                                    </span>
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic">
                                    {initialData ? 'Редактирование' : 'Новый расчет'}
                                </h1>
                                <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.4em] mt-1 italic">
                                    Шаг {step} из 3 • Система v2.1
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="group w-14 h-14 bg-background border border-foreground/5 hover:border-foreground/20 rounded-[1.2rem] flex items-center justify-center transition-all hover:bg-foreground hover:text-background"
                    >
                        <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
                    </button>
                </div>

                {step === 1 && (
                    <WizardStep1_Object
                        objectData={objectData}
                        setObjectData={setObjectData}
                        venues={venues}
                        onVenueSelect={handleVenueSelect}
                        onNext={() => setStep(2)}
                        zones={zones}
                    />
                )}

                {step === 2 && (
                    <WizardStep2_Zones
                        objectData={objectData}
                        zones={zones}
                        onBackToStep1={() => setStep(1)}
                        onAddZone={addZone}
                        onDeleteZone={deleteZone}
                        onCalculate={calculate}
                        showModal={showZoneModal}
                        setShowModal={setShowZoneModal}
                    />
                )}

                {step === 3 && results && (
                    <WizardStep3_Results
                        results={results}
                        isSubmitting={isSubmitting}
                        onSaveDraft={() => handleComplete('draft')}
                        onSendToManager={() => handleComplete('sent')}
                        onBackToStep2={() => setStep(2)}
                    />
                )}
            </div>
        );
    }
);
