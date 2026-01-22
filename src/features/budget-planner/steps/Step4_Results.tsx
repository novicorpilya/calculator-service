import React from 'react';
import { type BudgetPlan } from '@/core/domain/budget/budget.types';
import {
    Package,
    XCircle,
    CheckCircle2,
    ShoppingCart,
    RefreshCcw,
    ChevronLeft,
    Send,
} from 'lucide-react';

interface Step4Props {
    plan: BudgetPlan | null;
    onReset: () => void;
    onPrev: () => void;
    onSave: () => void;
    isSaving?: boolean;
    isEmbedMode?: boolean;
}

export const Step4_Results: React.FC<Step4Props> = ({
    plan,
    onReset,
    onPrev,
    onSave,
    isSaving,
    isEmbedMode = false,
}) => {
    if (!plan) return null;

    const baseTextClass = isEmbedMode ? 'text-slate-400' : 'text-foreground/40';
    const dividerClass = isEmbedMode ? 'border-slate-100' : 'border-white/5';

    return (
        <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <button
                    onClick={onPrev}
                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary transition-all group w-fit ${baseTextClass}`}
                >
                    <ChevronLeft
                        size={16}
                        className="group-hover:-translate-x-1 transition-transform"
                    />{' '}
                    Назад к расчету
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={onReset}
                        className={`flex-1 sm:flex-initial p-4 px-6 rounded-2xl border hover:bg-red-500/10 hover:text-red-400 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
                            isEmbedMode
                                ? 'border-slate-200 text-slate-400'
                                : 'border-white/10 text-foreground/40'
                        }`}
                    >
                        <RefreshCcw size={16} /> Сбросить
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex-1 sm:flex-initial p-4 px-8 rounded-2xl bg-primary text-white hover:shadow-2xl hover:shadow-primary/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            'Секунду...'
                        ) : (
                            <>
                                <ShoppingCart size={16} /> Получить смету
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h3
                    className={`text-3xl sm:text-5xl font-black tracking-tighter ${isEmbedMode ? 'text-slate-900' : 'text-white'}`}
                >
                    Детальный <span className="text-primary italic">состав</span>
                </h3>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${baseTextClass}`}>
                    Автоматически оптимизированная корзина под ваш бюджет
                </p>
            </div>

            <div className="space-y-16">
                {plan.allocations.map((allocation) => (
                    <div key={allocation.zoneId} className="space-y-8">
                        <div
                            className={`flex items-center justify-between border-b pb-6 ${dividerClass}`}
                        >
                            <div className="flex items-center gap-6">
                                <div
                                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-[24px] sm:rounded-[32px] flex items-center justify-center shadow-2xl transition-colors ${
                                        allocation.isFullyFunded
                                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                            : isEmbedMode
                                              ? 'bg-primary/5 text-primary border border-primary/10'
                                              : 'bg-primary/10 text-primary border border-primary/20'
                                    }`}
                                >
                                    {allocation.isFullyFunded ? (
                                        <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
                                    ) : (
                                        <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h4
                                        className={`font-black text-xl sm:text-2xl uppercase tracking-tighter ${isEmbedMode ? 'text-slate-900' : 'text-white'}`}
                                    >
                                        {allocation.zoneName}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <p
                                            className={`text-[10px] font-black uppercase tracking-widest leading-none ${baseTextClass}`}
                                        >
                                            Покрыто:{' '}
                                            <span
                                                className={
                                                    allocation.isFullyFunded
                                                        ? 'text-emerald-500'
                                                        : 'text-primary'
                                                }
                                            >
                                                {allocation.coveragePercent.toFixed(0)}%
                                            </span>
                                        </p>
                                        <div
                                            className={`w-1 h-1 rounded-full hidden sm:block ${isEmbedMode ? 'bg-slate-200' : 'bg-white/10'}`}
                                        ></div>
                                        <p
                                            className={`text-[10px] font-black uppercase tracking-widest leading-none ${baseTextClass}`}
                                        >
                                            {allocation.allocatedAmount.toLocaleString()} ₽ из{' '}
                                            {allocation.idealAmount.toLocaleString()} ₽
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                            {/* Included Items */}
                            <div className="space-y-6">
                                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    Входит в бюджет ({allocation.items.length})
                                </div>
                                <div className="space-y-3">
                                    {allocation.items.length > 0 ? (
                                        allocation.items.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`glass-card p-5 flex items-center justify-between transition-all group overflow-hidden relative ${
                                                    isEmbedMode
                                                        ? 'bg-white border border-slate-100 shadow-sm hover:border-emerald-500/30'
                                                        : '!bg-white/[0.02] border-white/5 hover:border-emerald-500/30'
                                                }`}
                                            >
                                                <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500/50 -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                                                <div className="space-y-1">
                                                    <p
                                                        className={`text-sm font-black tracking-tight ${isEmbedMode ? 'text-slate-900' : 'text-white'}`}
                                                    >
                                                        {item.inventory}
                                                    </p>
                                                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
                                                        {item.category} • {item.quantity} шт.
                                                    </p>
                                                </div>
                                                <p className="text-sm font-black text-emerald-500">
                                                    {item.total.toLocaleString()} ₽
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={`text-xs italic ml-2 py-4 ${baseTextClass}`}>
                                            Нет позиций для данного бюджета
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Dropped Items */}
                            {allocation.droppedItems.length > 0 && (
                                <div className="space-y-6">
                                    <div className="text-[10px] font-black text-red-500/60 uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
                                        <XCircle size={10} />
                                        Исключено ({allocation.droppedItems.length})
                                    </div>
                                    <div className="space-y-3">
                                        {allocation.droppedItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className={`glass-card p-5 flex items-center justify-between grayscale opacity-30 ${
                                                    isEmbedMode
                                                        ? 'bg-slate-50 border border-slate-100'
                                                        : '!bg-white/[0.01] border-white/5'
                                                }`}
                                            >
                                                <div className="space-y-1">
                                                    <p
                                                        className={`text-sm font-black tracking-tight ${isEmbedMode ? 'text-slate-900' : 'text-white'}`}
                                                    >
                                                        {item.inventory}
                                                    </p>
                                                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
                                                        {item.category}
                                                    </p>
                                                </div>
                                                <p
                                                    className={`text-sm font-black line-through ${isEmbedMode ? 'text-slate-400' : 'text-foreground/20'}`}
                                                >
                                                    {item.total.toLocaleString()} ₽
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div
                className={`glass-card p-10 sm:p-16 !bg-white text-black flex flex-col md:flex-row items-center justify-between gap-10 rounded-[48px] relative overflow-hidden group ${
                    isEmbedMode
                        ? 'shadow-2xl border border-slate-100'
                        : 'shadow-[0_32px_128px_-16px_rgba(255,255,255,0.1)]'
                }`}
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="space-y-4 text-center md:text-left relative z-10">
                    <h4 className="text-3xl sm:text-5xl font-black tracking-tighter leading-none">
                        Готовы к новому <br />{' '}
                        <span className="text-primary italic underline decoration-4 underline-offset-8">
                            уровню?
                        </span>
                    </h4>
                    <p className="text-sm sm:text-lg opacity-60 font-medium max-w-sm">
                        Мы подготовили для вас персональное предложение. Один шаг до идеальной
                        чистоты.
                    </p>
                </div>
                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="btn-premium !bg-black !text-white w-full md:w-auto px-16 py-8 !rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg sm:text-xl font-black uppercase tracking-widest flex items-center justify-center gap-3"
                >
                    {isSaving ? (
                        'Секунду...'
                    ) : (
                        <>
                            <Send size={24} /> Получить смету
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
