import React, { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { type Calculation } from '../../dashboard.types';
import { CalculationFactory } from '@/core/domain/CalculationFactory';
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
            clearDraft,
        } = useCalculationWizard(initialData);

        const [isSubmitting, setIsSubmitting] = useState<'draft' | 'sent' | null>(null);

        const handleComplete = async (status: 'draft' | 'sent') => {
            if (isSubmitting || !results) return;
            setIsSubmitting(status);
            try {
                const newCalc = CalculationFactory.createFromWizard({
                    objectData,
                    zones,
                    results,
                    status,
                    initialData,
                    configSnapshot: config,
                });
                await onComplete(newCalc);
                clearDraft();
            } finally {
                setIsSubmitting(null);
            }
        };

        return (
            <div
                className={`fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl px-4 sm:px-6 py-8 sm:p-20 ${showZoneModal ? 'overflow-hidden' : 'overflow-y-auto'}`}
            >
                <div className="max-w-7xl mx-auto mb-8 sm:mb-20 flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {step > 0 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1.2rem] bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all flex items-center justify-center group/back shrink-0"
                                aria-label="Назад"
                            >
                                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover/back:-translate-x-1 transition-transform" />
                            </button>
                        ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1.2rem] bg-foreground flex items-center justify-center shrink-0">
                                <span className="text-lg sm:text-xl font-black text-background">
                                    {step + 1}
                                </span>
                            </div>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-4xl font-black tracking-tighter uppercase italic truncate">
                                {initialData ? 'Редактирование' : 'Новый расчет'}
                            </h1>
                            <p className="text-[8px] sm:text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-0.5 italic">
                                Шаг {step + 1} из 3 • v2.1
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="group w-10 h-10 sm:w-14 sm:h-14 bg-card border border-border-theme hover:border-primary/50 rounded-xl sm:rounded-[1.2rem] flex items-center justify-center transition-all hover:bg-primary hover:text-white shrink-0 shadow-sm"
                        aria-label="Закрыть"
                    >
                        <X className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-90" />
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="max-w-7xl mx-auto mb-10 sm:mb-16">
                    <div className="flex items-center justify-center gap-2 sm:gap-4">
                        {[
                            { num: 0, label: 'Объект' },
                            { num: 1, label: 'Зоны' },
                            { num: 2, label: 'Результат' },
                        ].map((s, i) => (
                            <React.Fragment key={s.num}>
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-black transition-all duration-300 ${
                                            step >= s.num
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : 'bg-foreground/5 text-foreground/30'
                                        }`}
                                    >
                                        {step > s.num ? '✓' : s.num + 1}
                                    </div>
                                    <span
                                        className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-colors ${
                                            step >= s.num ? 'text-primary' : 'text-foreground/30'
                                        }`}
                                    >
                                        {s.label}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div
                                        className={`flex-1 h-0.5 max-w-[60px] sm:max-w-[100px] rounded-full transition-all duration-500 ${
                                            step > s.num ? 'bg-primary' : 'bg-foreground/10'
                                        }`}
                                    />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {step === 0 && (
                    <WizardStep1_Object
                        objectData={objectData}
                        setObjectData={setObjectData}
                        venues={venues}
                        onVenueSelect={handleVenueSelect}
                        onNext={() => setStep(1)}
                        zones={zones}
                    />
                )}

                {step === 1 && (
                    <WizardStep2_Zones
                        objectData={objectData}
                        zones={zones}
                        onBackToStep1={() => setStep(0)}
                        onAddZone={addZone}
                        onDeleteZone={deleteZone}
                        onCalculate={calculate}
                        showModal={showZoneModal}
                        setShowModal={setShowZoneModal}
                        results={results}
                    />
                )}

                {step === 2 && results && (
                    <WizardStep3_Results
                        results={results}
                        isSubmitting={isSubmitting}
                        onSaveDraft={() => handleComplete('draft')}
                        onSendToManager={() => handleComplete('sent')}
                        onBackToStep2={() => setStep(1)}
                    />
                )}
            </div>
        );
    }
);
