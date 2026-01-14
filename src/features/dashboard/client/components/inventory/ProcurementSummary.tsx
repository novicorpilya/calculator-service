import React from 'react';
import { Search, CheckCircle2, ArrowUpRight, Package } from 'lucide-react';
import { type InventoryItem, type Supplier } from '../../../dashboard.types';

interface ProcurementSummaryProps {
    procurementData: InventoryItem[];
    totalBudget: number;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    canSeePrices: boolean;
    suppliers: Supplier[];
}

export const ProcurementSummary: React.FC<ProcurementSummaryProps> = ({
    procurementData,
    totalBudget,
    searchQuery,
    setSearchQuery,
    canSeePrices,
    suppliers,
}) => {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {canSeePrices ? (
                    <div className="glass-card !bg-foreground !text-background p-8 flex flex-col justify-between overflow-hidden relative shadow-2xl">
                        <div className="space-y-2 relative z-10">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                                Общий бюджет закупки
                            </p>
                            <h3 className="text-4xl font-black tracking-tighter">
                                {totalBudget.toLocaleString()} ₽
                            </h3>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    </div>
                ) : (
                    <div className="glass-card !bg-primary !text-white p-8 flex flex-col justify-between overflow-hidden relative shadow-2xl">
                        <div className="space-y-2 relative z-10">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                                Расчетный объем
                            </p>
                            <h3 className="text-4xl font-black tracking-tighter">
                                {procurementData.reduce((s, i) => s + i.quantity, 0)}{' '}
                                <span className="text-sm opacity-50">ЕД.</span>
                            </h3>
                        </div>
                        <Package className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
                    </div>
                )}
                <div className="glass-card p-8 flex flex-col justify-between group shadow-xl">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em]">
                            Позиций к заказу
                        </p>
                        <h3 className="text-4xl font-black tracking-tighter">
                            {procurementData.length}
                        </h3>
                    </div>
                </div>
                <div className="glass-card p-8 flex items-center gap-6 bg-emerald-500/5 border-emerald-500/10 shadow-xl">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 size={28} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            Статус данных
                        </p>
                        <p className="text-[12px] font-black uppercase">
                            Учтены 100% утвержденных смет
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-border-theme flex items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Поиск по инвентарю..."
                            className="w-full bg-background/50 border border-border-theme rounded-2xl pl-16 pr-8 py-4 text-[13px] font-black outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-theme bg-primary/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                    Наименование позиции
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                    Поставщик
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                    Маркировка
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                    Количество
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">
                                    Сумма
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-theme">
                            {procurementData.length > 0 ? (
                                procurementData.map((item, i) => (
                                    <tr
                                        key={i}
                                        className="hover:bg-primary/5 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-[14px] font-black tracking-tight">
                                                    {item.inventory}
                                                </p>
                                                {canSeePrices && (
                                                    <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">
                                                        Цена за ед: {item.price.toLocaleString()} ₽
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                                                    {
                                                        (suppliers.find(
                                                            (s) => s.id === item.supplier_id
                                                        )?.name || 'N')[0]
                                                    }
                                                </div>
                                                <span className="text-[12px] font-black uppercase tracking-tight">
                                                    {suppliers.find(
                                                        (s) => s.id === item.supplier_id
                                                    )?.name || 'Не указан'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-10 h-10 rounded-xl shadow-inner border border-border-theme"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="text-[11px] font-black uppercase tracking-widest text-foreground/60">
                                                    {item.color}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-black text-lg">
                                            {item.quantity}{' '}
                                            <span className="text-[10px] text-foreground/20">
                                                ШТ.
                                            </span>
                                        </td>
                                        {canSeePrices && (
                                            <td className="px-8 py-6 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <p className="text-lg font-black tracking-tight">
                                                        {item.total.toLocaleString()} ₽
                                                    </p>
                                                    <ArrowUpRight
                                                        size={14}
                                                        className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                                    />
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={canSeePrices ? 5 : 4}
                                        className="px-8 py-40 text-center"
                                    >
                                        <div className="space-y-4">
                                            <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto text-primary/20">
                                                <Search size={40} />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/40">
                                                    Нет данных для закупки
                                                </p>
                                                <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-[0.2em] mt-2 max-w-xs mx-auto">
                                                    Убедитесь, что у вас есть утвержденные проекты
                                                    на этапе выставления счета
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
