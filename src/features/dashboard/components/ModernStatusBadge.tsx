import React from 'react';
import type { Calculation } from '../dashboard.types';

export const ModernStatusBadge = React.memo<{ status: Calculation['status'] }>(({ status }) => {
    const config = {
        draft: { label: 'Черновик', color: 'bg-slate-400', ghost: 'bg-card text-foreground/60' },
        sent: { label: 'На проверке', color: 'bg-primary', ghost: 'bg-primary/10 text-primary' },
        expert: { label: 'Экспертиза', color: 'bg-indigo-500', ghost: 'bg-indigo-500/10 text-indigo-600' },
        suppliers: { label: 'Подбор поставщиков', color: 'bg-yellow-500', ghost: 'bg-yellow-500/10 text-yellow-600' },
        changes: { label: 'Требуют правок', color: 'bg-orange-500', ghost: 'bg-orange-500/10 text-orange-600' },
        revision: { label: 'Правки внесены', color: 'bg-purple-500', ghost: 'bg-purple-500/10 text-purple-600' },
        invoice: { label: 'Выставлен счет', color: 'bg-cyan-500', ghost: 'bg-cyan-500/10 text-cyan-600' },
        paid: { label: 'Оплачено', color: 'bg-emerald-500', ghost: 'bg-emerald-500/10 text-emerald-600' },
        ready: { label: 'Готово к отгрузке', color: 'bg-green-500', ghost: 'bg-green-500/10 text-green-600' },
        shipping: { label: 'Поставка в работе', color: 'bg-amber-500', ghost: 'bg-amber-500/10 text-amber-600' },
        completed: { label: 'Поставка завершена', color: 'bg-teal-500', ghost: 'bg-teal-500/10 text-teal-600' },
        closed: { label: 'Проект закрыт', color: 'bg-slate-400', ghost: 'bg-slate-400/10 text-slate-500' },
    }[status];

    if (!config) return null;

    return (
        <div className={`px-4 py-1.5 rounded-full ${config.ghost} text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-current border-opacity-10`}>
            <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
            {config.label}
        </div>
    );
});
