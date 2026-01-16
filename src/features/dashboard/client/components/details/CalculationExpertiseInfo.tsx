import React from 'react';
import { Search, MessageSquare, Calculator, CreditCard } from 'lucide-react';

export const CalculationExpertiseInfo: React.FC = () => {
    const items = [
        {
            icon: Search,
            title: 'Аудит требований',
            desc: 'Проверка данных и анализ специфики объекта.',
        },
        {
            icon: MessageSquare,
            title: 'Коммуникация',
            desc: 'Уточнение нюансов в рабочем чате.',
        },
        {
            icon: Calculator,
            title: 'Корректировка',
            desc: 'Ручная настройка коэффициентов и оптимизация.',
        },
        {
            icon: CreditCard,
            title: 'Формирование',
            desc: 'Подготовка финальных документов и счета.',
        },
    ];

    return (
        <div className="glass-card !bg-indigo-500/5 border-indigo-500/30 p-10 space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-500 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
                    <Search size={32} />
                </div>
                <div className="space-y-1">
                    <h3 className="text-2xl font-black tracking-tight">
                        Проводится экспертиза
                    </h3>
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest italic">
                        Менеджер детально изучает проект и готовит финальное предложение.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="bg-card/40 p-6 rounded-[1.5rem] border border-border-theme space-y-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <item.icon size={20} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[11px] font-black uppercase tracking-wider">
                                {item.title}
                            </h4>
                            <p className="text-[10px] text-foreground/50 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
