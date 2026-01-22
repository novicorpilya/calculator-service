import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { BudgetPlannerWizard } from '@/features/budget-planner/components/BudgetPlannerWizard';
import { supabase } from '../../services/supabase';
import { ShieldX, Loader2, Building2 } from 'lucide-react';

interface PartnerValidationResult {
    is_valid: boolean;
    partner_name: string | null;
    error_code: string | null;
    error_message: string | null;
}

/**
 * EmbedCalculatorPage
 * Enterprise-grade standalone page for partner site embedding.
 * Validates partner access before rendering the calculator.
 */
export const EmbedCalculatorPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const partnerId = searchParams.get('partner');

    // SEO: Add noindex dynamically to prevent indexing even if bots reach here
    useEffect(() => {
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, nofollow';
        document.head.appendChild(meta);
        return () => {
            document.head.removeChild(meta);
        };
    }, []);

    const [validationState, setValidationState] = useState<{
        isLoading: boolean;
        isValid: boolean;
        partnerName: string | null;
        errorCode: string | null;
        errorMessage: string | null;
    }>({
        isLoading: true,
        isValid: false,
        partnerName: null,
        errorCode: null,
        errorMessage: null,
    });

    useEffect(() => {
        const validatePartner = async () => {
            // No partner ID = deny access
            if (!partnerId) {
                setValidationState((prev) => ({ ...prev, isLoading: false }));
                return;
            }

            try {
                // Get origin for domain validation
                const origin = window.location.ancestorOrigins?.[0] || document.referrer || null;

                // Call validation RPC
                const { data, error } = await supabase
                    .rpc('validate_partner_access', {
                        p_partner_id: partnerId,
                        p_origin: origin,
                    })
                    .single();

                if (error) {
                    console.error('Partner validation error:', error);
                    setValidationState({
                        isLoading: false,
                        isValid: false,
                        partnerName: null,
                        errorCode: 'VALIDATION_ERROR',
                        errorMessage: 'Unable to validate partner access',
                    });
                    return;
                }

                const result = data as PartnerValidationResult;

                setValidationState({
                    isLoading: false,
                    isValid: result.is_valid,
                    partnerName: result.partner_name,
                    errorCode: result.error_code,
                    errorMessage: result.error_message,
                });
            } catch (err) {
                console.error('Partner validation exception:', err);
                setValidationState({
                    isLoading: false,
                    isValid: false,
                    partnerName: null,
                    errorCode: 'SYSTEM_ERROR',
                    errorMessage: 'System error during validation',
                });
            }
        };

        validatePartner();
    }, [partnerId]);

    if (!partnerId && !validationState.isLoading) {
        return <Navigate to="/404" replace />;
    }

    // Loading State
    if (validationState.isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-slate-500 text-sm font-medium">Проверка доступа...</p>
                </div>
            </div>
        );
    }

    // Access Denied State
    if (!validationState.isValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-red-500/10 border border-red-100 p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldX className="w-8 h-8 text-red-500" />
                    </div>

                    <h1 className="text-xl font-black text-slate-900 mb-2">Доступ запрещён</h1>

                    <p className="text-slate-500 text-sm mb-6">
                        {validationState.errorMessage || 'Невозможно отобразить калькулятор'}
                    </p>

                    <div className="bg-slate-50 rounded-xl p-4 text-left">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                            Код ошибки
                        </p>
                        <code className="text-xs font-mono text-slate-600">
                            {validationState.errorCode || 'UNKNOWN'}
                        </code>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-6">
                        Если вы считаете, что это ошибка, свяжитесь с администратором системы.
                    </p>
                </div>
            </div>
        );
    }

    // Valid Partner - Render Calculator
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white text-slate-900 selection:bg-primary/20 overflow-x-hidden font-sans">
            {/* Light Theme Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[100px] rounded-full mix-blend-multiply"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 blur-[100px] rounded-full mix-blend-multiply transition-all duration-1000"></div>
            </div>

            {/* Partner Badge (optional branding) */}
            {validationState.partnerName && (
                <div className="fixed top-4 right-4 z-20 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {validationState.partnerName}
                    </span>
                </div>
            )}

            <main className="relative z-10 w-full min-h-screen flex flex-col items-center justify-start py-4 sm:py-8 lg:py-16 px-2 sm:px-4">
                <div className="w-full max-w-7xl mx-auto">
                    <BudgetPlannerWizard isEmbedMode={true} />
                </div>
            </main>
        </div>
    );
};

export default EmbedCalculatorPage;
