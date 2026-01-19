import React, { useState, useEffect, useCallback } from 'react';
import {
    Search,
    RefreshCw,
    Package,
    ChevronLeft,
    ChevronRight,
    Building2,
    Layers,
} from 'lucide-react';
import { type InventoryItemMaster, type Supplier } from '@/services/inventory.service';
import { toast } from 'sonner';
import { useServices } from '@/app/di/ServiceContainer';
import { ZONE_TYPES } from '@/features/dashboard/dashboard.types';

/**
 * Product Catalog View for Managers (Registry).
 * Optimized with server-side pagination, supplier breakdown, and advanced filters.
 */
export const MasterInventoryManager = React.memo(() => {
    const { inventoryService } = useServices();

    // Data State
    const [items, setItems] = useState<InventoryItemMaster[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Control State
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedZone, setSelectedZone] = useState<string>('all');

    // Derived Categories from items (simplified, ideally from DB)
    const categories = [
        'Кухонная химия',
        'Общая химия',
        'Санитария',
        'Оборудование',
        'Инвентарь',
        'Расходные материалы',
        'Системы',
        'Бумага',
        'Гигиена',
    ];

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Fetch Items with current filters
            const result = await inventoryService.getGlobalItems({
                page,
                pageSize,
                search: searchQuery,
                supplierId: selectedSupplier === 'all' ? undefined : selectedSupplier,
                category: selectedCategory === 'all' ? undefined : selectedCategory,
                color: selectedZone === 'all' ? undefined : selectedZone,
            });

            if (result.success && result.data) {
                setItems(result.data.data);
                setTotalCount(result.data.count);
                setTotalPages(result.data.totalPages);
            } else {
                toast.error(result.error?.message || 'Ошибка при загрузке реестра товаров');
            }

            // 2. Fetch Suppliers if not already loaded
            if (suppliers.length === 0) {
                const sResult = await inventoryService.getSuppliers();
                if (sResult.success && sResult.data) {
                    setSuppliers(sResult.data);
                }
            }
        } catch {
            toast.error('Ошибка при загрузке реестра товаров');
        } finally {
            setLoading(false);
        }
    }, [
        inventoryService,
        page,
        pageSize,
        searchQuery,
        selectedSupplier,
        selectedCategory,
        selectedZone,
        suppliers.length,
    ]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handlePageChange = (p: number) => {
        if (p >= 1 && p <= totalPages) {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
                        Реестр товаров
                    </h1>
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-4">
                            Глобальный каталог и коммерческие спецификации
                        </p>
                        <div className="px-3 py-1 bg-primary/10 rounded-full text-[9px] font-black text-primary uppercase tracking-widest">
                            {totalCount} позиций
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        onClick={() => {
                            setPage(1);
                            fetchData();
                        }}
                        className="flex items-center gap-3 px-6 py-4 bg-card border border-border-theme rounded-2xl hover:text-primary transition-all group shadow-sm"
                    >
                        <RefreshCw
                            size={18}
                            className={`${loading ? 'animate-spin' : ''} transition-transform group-hover:rotate-180`}
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            Синхронизировать
                        </span>
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass-card !p-8 border-primary/10 shadow-xl space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Search */}
                    <div className="lg:col-span-4 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
                        <input
                            type="text"
                            placeholder="Поиск..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-background/50 border border-border-theme rounded-2xl pl-16 pr-8 py-5 text-[13px] font-black outline-none focus:border-primary transition-all shadow-inner"
                        />
                    </div>

                    {/* Supplier Filter */}
                    <div className="lg:col-span-3 relative">
                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                        <select
                            value={selectedSupplier}
                            onChange={(e) => {
                                setSelectedSupplier(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-background/50 border border-border-theme rounded-2xl pl-12 pr-4 py-5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:border-primary transition-all cursor-pointer"
                        >
                            <option value="all">Все поставщики</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className="lg:col-span-3 relative">
                        <Layers className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-background/50 border border-border-theme rounded-2xl pl-12 pr-4 py-5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:border-primary transition-all cursor-pointer"
                        >
                            <option value="all">Все категории</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Zone Filter */}
                    <div className="lg:col-span-2 relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-primary/20" style={{ backgroundColor: selectedZone !== 'all' ? selectedZone : 'transparent' }} />
                        <select
                            value={selectedZone}
                            onChange={(e) => {
                                setSelectedZone(e.target.value);
                                setPage(1);
                            }}
                            className="w-full bg-background/50 border border-border-theme rounded-2xl pl-12 pr-4 py-5 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:border-primary transition-all cursor-pointer"
                        >
                            <option value="all">Все зоны</option>
                            {ZONE_TYPES.map((z) => (
                                <option key={z.value} value={z.color}>
                                    {z.label.split('—')[0].trim()}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Product Table */}
            <div className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl min-h-[600px] flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-theme bg-primary/5">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                    Товар / Артикул
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                    Поставщик & Категория
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">
                                    Остаток
                                </th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">
                                    Цена
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-theme">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-8 py-8">
                                            <div className="h-12 bg-foreground/5 rounded-2xl w-full" />
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="h-8 bg-foreground/5 rounded-xl w-3/4" />
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="h-10 bg-foreground/5 rounded-xl w-24 mx-auto" />
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="h-10 bg-foreground/5 rounded-xl w-24 mx-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-8 py-40 text-center flex flex-col items-center justify-center gap-4"
                                    >
                                        <Package size={48} className="opacity-10" />
                                        <p className="text-foreground/20 text-[10px] font-black uppercase tracking-[0.3em]">
                                            Ничего не найдено в этой категории
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-primary/5 transition-colors group"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-primary bg-primary/10 relative overflow-hidden shrink-0 shadow-sm border border-primary/5">
                                                    <Package
                                                        size={22}
                                                        className="group-hover:scale-110 transition-transform"
                                                    />
                                                    <div
                                                        className="absolute bottom-0 left-0 w-full h-1.5"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[15px] font-black tracking-tight mb-1 truncate">
                                                        {item.name}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 bg-background border border-border-theme rounded text-[8px] font-bold text-foreground/40 uppercase tracking-widest">
                                                            {item.sku || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                                                    <Building2 size={12} />
                                                    {item.supplier?.name || 'Внешний поставщик'}
                                                </div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-background border border-border-theme rounded-lg">
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                                                        {item.category || 'Без категории'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div
                                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all ${item.stock < 10 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-background border-border-theme'}`}
                                            >
                                                <span className="text-[14px] font-black tracking-tight">
                                                    {item.stock.toLocaleString()}
                                                </span>
                                                <span className="text-[8px] font-bold uppercase opacity-50">
                                                    шт
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-2xl shadow-xl shadow-foreground/5 group-hover:bg-primary transition-colors">
                                                <span className="text-[14px] font-black tracking-tight">
                                                    {item.price.toLocaleString()} ₽
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="p-8 bg-primary/5 border-t border-border-theme flex flex-col sm:flex-row items-center justify-between gap-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                            Страница <span className="text-primary">{page}</span> из {totalPages}
                            <span className="mx-4 opacity-50">•</span>
                            Показано {items.length} из {totalCount}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || loading}
                                className="w-12 h-12 flex items-center justify-center bg-card border border-border-theme rounded-xl hover:text-primary disabled:opacity-30 disabled:hover:text-foreground transition-all active:scale-90"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div className="flex items-center gap-2 px-2">
                                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                    let pageNum = page;
                                    if (page <= 3) pageNum = i + 1;
                                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = page - 2 + i;

                                    if (pageNum <= 0 || pageNum > totalPages) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-12 h-12 rounded-xl text-[11px] font-black transition-all ${page === pageNum ? 'bg-primary text-white shadow-lg' : 'hover:bg-primary/10'}`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages || loading}
                                className="w-12 h-12 flex items-center justify-center bg-card border border-border-theme rounded-xl hover:text-primary disabled:opacity-30 disabled:hover:text-foreground transition-all active:scale-90"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});
