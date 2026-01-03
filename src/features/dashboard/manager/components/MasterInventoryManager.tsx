import React, { useState, useEffect } from 'react';
import {
    Search,
    RefreshCw,
    Package,
    Tag,
    DollarSign
} from 'lucide-react';
import { inventoryService, type InventoryItemMaster } from '@/services/inventory.service';
import { ZONE_TYPES } from '../../dashboard.types';
import { toast } from 'sonner';

/**
 * Product Catalog View for Managers.
 * Displays the current global assortment synchronized with the supplier database.
 */
export const MasterInventoryManager = React.memo(() => {
    const [items, setItems] = useState<InventoryItemMaster[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchItems = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getGlobalItems();
            setItems(data);
        } catch (error) {
            toast.error('Ошибка при загрузке ассортимента');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Реестр товаров</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-4">
                        Актуальный ассортимент и коммерческие цены поставщика
                    </p>
                </div>
                <button
                    onClick={fetchItems}
                    className="flex items-center gap-3 px-6 py-4 bg-card border border-border-theme rounded-2xl hover:text-primary transition-all group"
                >
                    <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''} transition-transform group-hover:rotate-180`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Обновить данные</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex flex-col justify-between">
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-4">Всего в базе</p>
                    <h4 className="text-3xl font-black">{items.length}</h4>
                </div>
                <div className="glass-card p-6 flex items-center gap-4 bg-primary/5 border-primary/10 md:col-span-2">
                    <div className="p-3 bg-primary text-white rounded-xl">
                        <Tag size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-foreground/60 leading-relaxed uppercase tracking-wider">
                        Данный список синхронизируется напрямую с базой поставщика. Для изменения спецификаций или цен обратитесь в отдел закупок.
                    </p>
                </div>
            </div>

            {/* Product Table */}
            <div className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-border-theme">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
                        <input
                            type="text"
                            placeholder="Поиск по названию или артикулу..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-background/50 border border-border-theme rounded-2xl pl-16 pr-8 py-4 text-[13px] font-black outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-theme bg-primary/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Товар / Артикул</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Сфера применения</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">Остаток</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">Текущая цена</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && items.length === 0 ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={3} className="h-24 px-8 border-b border-border-theme">
                                            <div className="h-4 bg-foreground/5 rounded-full w-3/4 mb-3" />
                                            <div className="h-3 bg-foreground/5 rounded-full w-1/4" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-8 py-12 text-center text-foreground/20 text-[10px] font-black uppercase tracking-widest">
                                        Товары не найдены
                                    </td>
                                </tr>
                            ) : filteredItems.map((item) => (
                                <tr key={item.id} className="border-b border-border-theme hover:bg-primary/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-primary bg-primary/10 relative overflow-hidden shrink-0">
                                                <Package size={20} />
                                                <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: item.color }} />
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-black tracking-tight mb-0.5">{item.name}</p>
                                                <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">
                                                    SKU: {item.sku || 'ART-NO-ID'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-background border border-border-theme rounded-lg">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-[9px] font-black uppercase tracking-widest">
                                                {ZONE_TYPES.find(z => z.color === item.color)?.label || 'Универсальный'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${item.stock < 10 ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-background border-border-theme'}`}>
                                            <span className="text-[13px] font-black tracking-tight">{item.stock.toLocaleString()}</span>
                                            <span className="text-[8px] font-bold uppercase">шт</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl">
                                            <DollarSign size={14} className="text-primary" />
                                            <span className="text-[13px] font-black tracking-tight">{item.price.toLocaleString()} ₽</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});
