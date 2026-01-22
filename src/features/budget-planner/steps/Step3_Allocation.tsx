import React, { useEffect, useState } from 'react';
import { type BudgetPlan } from '@/core/domain/budget/budget.types';
import { CheckCircle2, AlertTriangle, TrendingUp, ChevronLeft } from 'lucide-react';

interface Step3Props {
    plan: BudgetPlan | null;
    onNext: () => void;
    onPrev: () => void;
}

const ALLOCATION_STATUSES = [
    'Инициализация двигателя бюджета...',
    'Загрузка нормативов инвентаря...',
    'Распределение по критическим зонам...',
    'Балансировка стандартных приоритетов...',
    'Анализ остаточных средств...',
    'Финальное формирование плана...',
];

export const Step3_Allocation: React.FC<Step3Props> = ({ plan, onNext, onPrev }) => {
    const [simulating, setSimulating] = useState(true);
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);

    const statuses = ALLOCATION_STATUSES;

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setTimeout(() => setSimulating(false), 800);
                    return 100;
                }
                const newProgress = prev + (Math.random() * 3 + 1);
                setStatusIndex(
                    Math.min(Math.floor((newProgress / 100) * statuses.length), statuses.length - 1)
                );
                return Math.min(newProgress, 100);
            });
        }, 100);
        return () => clearInterval(interval);
    }, [statuses]); // statuses is constant now but let's keep it safe or remove if moved out completely.
    // If I move statuses to constant outside, I don't need to put it in dep array if I use global const, but here I assigned it to local var.
    // Actually, simple fix: use global ALLOCATION_STATUSES directly in effect.

    if (simulating) {
        return (
            <div className="py-20 flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-500">
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="60"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-primary/10"
                        />
                        <circle
                            cx="64"
                            cy="64"
                            r="60"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeDasharray={377}
                            strokeDashoffset={377 - (377 * progress) / 100}
                            strokeLinecap="round"
                            className="text-primary transition-all duration-300"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-2xl">
                        {Math.round(progress)}%
                    </div>
                </div>

                <div className="text-center space-y-3">
                    <h2 className="text-2xl font-black tracking-tight h-8">
                        {statuses[statusIndex]}
                    </h2>
                    <p className="text-foreground/40 text-[10px] font-black uppercase tracking-widest">
                        Распределяем {plan?.totalBudget.toLocaleString()} ₽ по заданным приоритетам
                    </p>
                </div>

                <div className="w-full max-w-md bg-primary/5 h-2 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in zoom-in-95 fade-in duration-700">
            <div className="flex items-center justify-between">
                <button
                    onClick={onPrev}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-primary transition-colors"
                >
                    <ChevronLeft size={16} /> Назад
                </button>
            </div>

            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={32} />
                </div>
                <h2 className="text-3xl font-black tracking-tight">План сформирован!</h2>
                <p className="text-foreground/40 text-xs font-black uppercase tracking-widest">
                    Мы нашли оптимальное решение под ваш бюджет
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-8 space-y-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                        Охват потребностей
                    </p>
                    <p className="text-4xl font-black text-primary">
                        {plan?.coveragePercent.toFixed(0)}%
                    </p>
                </div>
                <div className="glass-card p-8 space-y-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                        Укомплектовано зон
                    </p>
                    <p className="text-4xl font-black">
                        {plan?.summary.fullyFundedZones} / {plan?.allocations.length}
                    </p>
                </div>
                <div className="glass-card p-8 space-y-2 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                        Остаток бюджета
                    </p>
                    <p className="text-4xl font-black text-emerald-500">
                        {((plan?.totalBudget ?? 0) - (plan?.actualTotal ?? 0)).toLocaleString()} ₽
                    </p>
                </div>
            </div>

            <div className="glass-card p-10 bg-primary/5 border-primary/20 space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={16} /> Ключевые выводы
                </h4>
                <div className="space-y-4">
                    {plan?.suggestions.map((s, i) => (
                        <div
                            key={i}
                            className="flex gap-4 items-start p-4 bg-background/50 rounded-2xl border border-white/5"
                        >
                            <div
                                className={`p-2 rounded-xl shrink-0 ${
                                    s.type === 'warning'
                                        ? 'bg-red-500/10 text-red-500'
                                        : s.type === 'upsell'
                                          ? 'bg-emerald-500/10 text-emerald-500'
                                          : 'bg-primary/10 text-primary'
                                }`}
                            >
                                {s.type === 'warning' ? (
                                    <AlertTriangle size={16} />
                                ) : (
                                    <TrendingUp size={16} />
                                )}
                            </div>
                            <p className="text-sm font-bold leading-relaxed">{s.message}</p>
                        </div>
                    ))}
                </div>
            </div>

            <button onClick={onNext} className="btn-premium w-full py-6 text-lg font-black">
                Посмотреть детализацию
            </button>
        </div>
    );
};
