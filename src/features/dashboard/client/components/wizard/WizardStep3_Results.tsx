import React from 'react';
import { CheckCircle2, Loader2, Save, ArrowRight, Sparkles, FileText, ChevronLeft } from 'lucide-react';
import { type CalculationResults, type CalculationStatus } from '@/features/dashboard/dashboard.types';
import { CalculationBreakdown } from '../CalculationBreakdown';
import { useAuth } from '@/features/auth';

interface WizardStep3Props {
    results: CalculationResults;
    isSubmitting: CalculationStatus | null;
    onSaveDraft: () => void;
    onSendToManager: () => void;
    onBackToStep2: () => void;
}

export const WizardStep3_Results: React.FC<WizardStep3Props> = ({
    results, isSubmitting, onSaveDraft, onSendToManager, onBackToStep2
}) => {
    const { user } = useAuth();
    const totalItemsCount = results.summary.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-12 pb-20">
            {/* Specification Status Header */}
            <div className="glass-card !p-12 text-center relative overflow-hidden">
                <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                        <CheckCircle2 size={36} />
                    </div>
                    <h2 className="text-[clamp(1.5rem,5vw,4rem)] font-black tracking-tighter leading-none italic uppercase">Спецификация сформирована</h2>
                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.5em] mt-4">Методология ISO 18406 + BICSc Standards</p>
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            </div>

            {/* Operational Summary Benchmarks (Prices Hidden for Clients) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-10 space-y-4">
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Текущий запас (Stock)</p>
                    <h4 className="text-4xl font-black tracking-tighter">{totalItemsCount.toLocaleString()} <span className="text-xs text-foreground/20">ЕД</span></h4>
                </div>
                <div className="glass-card p-10 space-y-4">
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">Месячная потребность (Plan)</p>
                    <h4 className="text-4xl font-black tracking-tighter">
                        {results.summary.reduce((sum, item) => sum + (item.calculation?.monthlyOrder || 0), 0).toFixed(1)}
                        <span className="text-xs text-foreground/20 ml-1">ЕД/МЕС</span>
                    </h4>
                </div>
            </div>

            {/* Detailed Product Breakdown Cards */}
            <div className="space-y-8">
                <div className="flex items-center gap-6 px-1">
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-primary">Технический аудит позиций</h3>
                    <div className="h-px grow bg-primary/10" />
                </div>
                <div className="grid grid-cols-1 gap-12">
                    {results.summary.map((item, i) => (
                        <CalculationBreakdown key={i} item={item} hidePrices={user?.role !== 'admin' && user?.role !== 'manager'} />
                    ))}
                </div>
            </div>

            {/* Global Summary Table for Export Preparation */}
            <div className="glass-card !bg-card !p-0 overflow-hidden shadow-3xl">
                <div className="p-8 border-b border-border-theme bg-primary/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Сводная ведомость по объекту</h3>
                    <div className="flex items-center gap-2 px-4 py-2 bg-background border border-border-theme rounded-xl">
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/50">Валюта: RUB (₽)</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-theme">
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-foreground/30">Наименование инвентаря</th>
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-foreground/30 text-center">Зона</th>
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-foreground/30 text-center">Количество</th>
                                <th className="px-8 py-6 text-[9px] font-black uppercase tracking-widest text-foreground/30 text-center">Цикл замены</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.summary.map((item, i) => (
                                <tr key={i} className="border-b border-border-theme hover:bg-primary/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <p className="text-sm font-black group-hover:text-primary transition-colors">{item.inventory}</p>
                                        <p className="text-[8px] font-bold text-foreground/30 uppercase tracking-widest">{item.sku}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-block w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: item.color }} />
                                    </td>
                                    <td className="px-8 py-6 text-center font-black text-sm">{item.quantity} шт</td>
                                    <td className="px-8 py-6 text-center text-[10px] font-black uppercase tracking-widest opacity-40">Раз в {item.norms?.replacementCycle} дн</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Final Action - Asymmetric Layout (RECOMMENDED) */}
            <div className="glass-card !bg-foreground !text-background relative overflow-hidden group/card p-8 sm:p-12 lg:p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
                <div className="relative z-10">
                    {/* Desktop View */}
                    <div className="hidden lg:block">
                        <div className="flex items-end justify-between gap-12">
                            {/* Left Column - Information */}
                            <div className="space-y-6 flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full border border-primary/10">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Рекомендуемое действие</span>
                                </div>

                                <h3 className="text-[clamp(2rem,3.5vw,3rem)] font-black leading-[1.1] tracking-tighter max-w-xl italic uppercase">
                                    Передать спецификацию эксперту на аудит
                                </h3>

                                <p className="text-white/40 text-sm font-medium italic max-w-lg">
                                    Менеджер проверит наличие на складе и сформирует коммерческое предложение за 15 минут
                                </p>
                            </div>

                            {/* Right Column - Actions */}
                            <div className="flex flex-col items-stretch gap-4 min-w-[320px]">
                                <button
                                    onClick={onSaveDraft}
                                    disabled={!!isSubmitting}
                                    className="h-14 px-8 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
                                >
                                    {isSubmitting === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100" />}
                                    {isSubmitting === 'draft' ? 'Сохранение...' : 'Сохранить черновик'}
                                </button>

                                <button
                                    onClick={onSendToManager}
                                    disabled={!!isSubmitting}
                                    className="h-20 px-12 bg-white text-black font-black rounded-2xl hover:shadow-2xl transition-all flex items-center justify-center gap-4 disabled:opacity-50 group relative overflow-hidden"
                                    style={{
                                        boxShadow: isSubmitting === 'sent' ? 'none' : '0 30px 60px -15px rgba(255,255,255,0.4)'
                                    }}
                                >
                                    <span className="text-[11px] uppercase tracking-widest">
                                        {isSubmitting === 'sent' ? 'Отправка...' : 'ОТПРАВИТЬ ЭКСПЕРТУ'}
                                    </span>
                                    {isSubmitting === 'sent' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="lg:hidden space-y-10">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full border border-primary/10">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Рекомендуемое действие</span>
                            </div>

                            <h3 className="text-3xl font-black text-white leading-tight italic uppercase tracking-tighter">
                                Передать спецификацию эксперту на аудит
                            </h3>

                            <p className="text-white/40 text-sm font-medium italic">
                                Менеджер проверит наличие и сформирует КП за 15 минут
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={onSendToManager}
                                disabled={!!isSubmitting}
                                className="h-16 px-8 bg-white text-black font-black rounded-2xl hover:shadow-lg transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                            >
                                <span className="text-[10px] uppercase tracking-widest">
                                    {isSubmitting === 'sent' ? 'Отправка...' : 'ОТПРАВИТЬ ЭКСПЕРТУ'}
                                </span>
                                {isSubmitting === 'sent' ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                            </button>

                            <button
                                onClick={onSaveDraft}
                                disabled={!!isSubmitting}
                                className="h-14 px-8 text-[11px] font-black uppercase tracking-widest text-white/70 hover:text-white bg-white/5 border border-white/15 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSubmitting === 'draft' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 opacity-70" />}
                                {isSubmitting === 'draft' ? 'Сохранение...' : 'Сохранить черновик'}
                            </button>
                        </div>
                    </div>

                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-2 mt-12 border-t border-white/10 pt-8 transition-colors hover:text-white/60">
                        <FileText className="w-3.5 h-3.5 text-primary/60" />
                        Спецификация будет доступна в личном кабинете
                    </p>
                </div>
                {/* Interactive Design Element */}
                <div className="absolute top-0 right-0 w-[60%] h-full bg-primary/20 blur-[130px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/30 transition-colors duration-1000" />
            </div>

            <div className="flex justify-center pt-10">
                <button
                    onClick={onBackToStep2}
                    className="group flex items-center gap-4 text-[11px] font-black text-foreground/20 uppercase tracking-[0.5em] hover:text-primary transition-all"
                >
                    <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-2" /> РЕДАКТИРОВАТЬ ПАРАМЕТРЫ ОБЪЕКТА
                </button>
            </div>
        </div>
    );
};
