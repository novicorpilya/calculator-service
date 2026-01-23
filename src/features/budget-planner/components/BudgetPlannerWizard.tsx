import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Step1_Envelope } from '../steps/Step1_Envelope';
import { Step2_Priorities } from '../steps/Step2_Priorities';
import { Step3_Allocation } from '../steps/Step3_Allocation';
import { Step4_Results } from '../steps/Step4_Results';
import { useBudgetPlanner } from '../hooks/useBudgetPlanner';
import { CalculationFactory } from '@/core/domain/CalculationFactory';
import { useCalculationActions } from '@/features/dashboard/hooks/useCalculations';
import { useAuth } from '@/features/auth/index.ts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { LeadForm } from './LeadForm';

interface BudgetPlannerWizardProps {
    isEmbedMode?: boolean;
}

export const BudgetPlannerWizard: React.FC<BudgetPlannerWizardProps> = ({
    isEmbedMode = false,
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { create } = useCalculationActions();
    const [isSaving, setIsSaving] = useState(false);
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        step,
        setStep,
        budget,
        setBudget,
        objectData,
        setObjectData,
        zones,
        addZone,
        updateZonePriority,
        updateZoneArea,
        removeZone,
        plan,
    } = useBudgetPlanner();

    const handleSave = async () => {
        if (!plan) return;

        if (isEmbedMode) {
            setShowLeadForm(true);
            return;
        }

        setIsSaving(true);
        try {
            const calculation = CalculationFactory.createFromBudgetPlan({
                plan,
                objectData,
                originalZones: zones,
            });
            const result = await create.mutateAsync({ calculation, userId: user!.id });
            toast.success('Проект успешно создан из плана!');

            if (result && result.id) {
                navigate(`/dashboard/client?id=${result.id}`);
            } else {
                navigate('/dashboard/client');
            }
        } catch (error) {
            console.error(error);
            toast.error('Ошибка при создании проекта');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLeadSubmit = async (contactData: {
        name: string;
        email: string;
        phone: string;
    }) => {
        setIsSaving(true);

        // --- LOCAL DEVELOPMENT MOCK ---
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🚀 [DEV MODE] Отправка лида (имитация):', {
                contactData,
                objectData,
                zonesCount: zones.length,
                partnerId: new URLSearchParams(window.location.search).get('partner') || 'default',
            });

            await new Promise((resolve) => setTimeout(resolve, 1500)); // Имитация задержки сети
            await new Promise((resolve) => setTimeout(resolve, 1500)); // Имитация задержки сети
            toast.success('Заявка отправлена (Mock)!');
            setIsSaving(false);
            setIsSuccess(true);
            return;
        }

        try {
            const params = new URLSearchParams(window.location.search);
            const partnerId = params.get('partner') || 'default_public';

            // Use the proxy API to avoid CORS issues with Supabase Edge Functions
            const apiUrl = import.meta.env.VITE_API_URL || ''; // Fallback to relative path
            const response = await fetch(
                `${apiUrl}/api/calculate-quote`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': partnerId,
                    },
                    body: JSON.stringify({
                        facility_type: objectData.type,
                        area: parseFloat(objectData.totalArea),
                        intensity_level: objectData.intensityLevel,
                        staff_count: parseInt(objectData.staffCount),
                        daily_visitors: parseInt(objectData.dailyVisitors),
                        save_lead: true,
                        client_email: contactData.email,
                        client_phone: contactData.phone,
                        zones: zones.map((z) => ({
                            name: z.name,
                            type: z.type,
                            area: parseFloat(z.area),
                            staff_count: parseInt(z.staffCount),
                            priority: z.priority,
                            color: z.color,
                        })),
                    }),
                }
            );

            if (!response.ok) throw new Error('Failed to submit lead');

            toast.success('Заявка отправлена!');
            setIsSuccess(true);
        } catch (error) {
            console.error(error);
            toast.error('Не удалось отправить заявку');
            throw error;
        } finally {
            setIsSaving(false);
        }
    };

    // --- AUTO RESIZE FOR IFRAME ---
    const containerRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (!isEmbedMode) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const height = Math.ceil(entry.contentRect.height + 100);
                window.parent.postMessage({ type: 'HICS_RESIZE', height }, '*');
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [isEmbedMode, showLeadForm, step]);

    if (showLeadForm) {
        if (isSuccess) {
            return (
                <div
                    ref={containerRef}
                    className={`w-full max-w-2xl mx-auto py-16 px-10 text-center ${
                        isEmbedMode
                            ? 'bg-white/80 backdrop-blur-xl rounded-[48px] border border-slate-200 shadow-2xl text-slate-900'
                            : 'bg-white/5 backdrop-blur-xl rounded-[48px] border border-white/10 shadow-2xl'
                    }`}
                >
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30 animate-in zoom-in duration-300">
                        <Check className="w-10 h-10 text-white" strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-black uppercase tracking-tight mb-4">
                        Заявка принята!
                    </h2>
                    <p className="text-lg opacity-60 mb-8 max-w-md mx-auto leading-relaxed">
                        Мы получили ваш расчет и свяжемся с вами в ближайшее время для обсуждения деталей проекта.
                    </p>
                    <button
                        onClick={() => {
                            setIsSuccess(false);
                            setShowLeadForm(false);
                            setStep(0);
                        }}
                        className="btn-premium px-8 py-3 text-xs"
                    >
                        Вернуться в начало
                    </button>
                </div>
            );
        }

        return (
            <div
                ref={containerRef}
                className={`w-full max-w-2xl mx-auto py-8 sm:py-16 px-4 sm:px-10 ${
                    isEmbedMode
                        ? 'bg-white/80 backdrop-blur-xl rounded-[32px] sm:rounded-[48px] border border-slate-200 shadow-2xl text-slate-900'
                        : 'bg-white/5 backdrop-blur-xl rounded-[32px] sm:rounded-[48px] border border-white/10 shadow-2xl'
                }`}
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"></div>
                <LeadForm
                    onSubmit={handleLeadSubmit}
                    isSubmitting={isSaving}
                    isEmbedMode={isEmbedMode}
                />
                <button
                    onClick={() => setShowLeadForm(false)}
                    className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 hover:text-primary mx-auto block transition-all"
                >
                    ← Вернуться к расчету
                </button>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`w-full max-w-6xl mx-auto py-6 sm:py-12 px-4 sm:px-8 ${
                isEmbedMode
                    ? 'bg-white/80 backdrop-blur-xl rounded-[32px] sm:rounded-[48px] border border-slate-200 shadow-2xl text-slate-900'
                    : ''
            }`}
        >
            {!isEmbedMode && (
                <div className="mb-12 flex items-center justify-center gap-4">
                    {[0, 1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                    step === s
                                        ? 'bg-primary text-white scale-110 shadow-lg'
                                        : step > s
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-foreground/5 text-foreground/20'
                                }`}
                            >
                                {step > s ? '✓' : s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={`w-12 h-0.5 mx-2 ${step > s ? 'bg-emerald-500' : 'bg-foreground/5'}`}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {step === 0 && (
                <Step1_Envelope
                    budget={budget}
                    setBudget={setBudget}
                    objectData={objectData}
                    setObjectData={setObjectData}
                    onNext={() => setStep(1)}
                    isEmbedMode={isEmbedMode}
                />
            )}

            {step === 1 && (
                <Step2_Priorities
                    zones={zones}
                    onAddZone={addZone}
                    onUpdatePriority={updateZonePriority}
                    onUpdateArea={updateZoneArea}
                    onRemoveZone={removeZone}
                    totalObjectArea={objectData.totalArea || '1000'} // Default or from object
                    onNext={() => setStep(2)}
                    onPrev={() => setStep(0)}
                    isEmbedMode={isEmbedMode}
                />
            )}

            {step === 2 && (
                <Step3_Allocation plan={plan} onNext={() => setStep(3)} onPrev={() => setStep(1)} />
            )}

            {step === 3 && (
                <Step4_Results
                    plan={plan}
                    onReset={() => setStep(0)}
                    onPrev={() => setStep(2)}
                    onSave={handleSave}
                    isSaving={isSaving}
                    isEmbedMode={isEmbedMode}
                />
            )}
        </div>
    );
};
