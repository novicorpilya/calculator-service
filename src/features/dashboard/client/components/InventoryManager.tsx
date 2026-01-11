import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Package,
    ShoppingCart,
    Filter,
    Download,
    Search,
    ArrowUpRight,
    CheckCircle2,
    Info,
    Building,
    Star,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    Layers
} from 'lucide-react';
import { type Calculation, type InventoryItem, type Supplier } from '../../dashboard.types';
import { type Venue } from '@/services/venue.service';
import { type InventoryItemMaster } from '@/services/inventory.service';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { useServices } from '@/core/di/ServiceContainer';
import { logger } from '@/app/services';

interface InventoryManagerProps {
    calculations: Calculation[];
    venues: Venue[];
}

/**
 * Inventory management hub for clients.
 * Handles procurement summaries, catalog browsing (directory), and filtering.
 * Optimized with server-side pagination for the Catalog tab.
 */
export const InventoryManager = React.memo<InventoryManagerProps>(({ calculations, venues }) => {
    const { supplierService, inventoryService } = useServices();

    // Tabs
    const [activeTab, setActiveTab] = useState<'procurement' | 'catalog'>('procurement');

    // Pagination & Data State (Catalog)
    const [catalogItems, setCatalogItems] = useState<InventoryItemMaster[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);

    // Common State
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVenue, setSelectedVenue] = useState<string>('all');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const { user } = useAuth();
    const canSeePrices = user?.role === 'manager' || user?.role === 'admin';

    const categories = ['Кухонная химия', 'Общая химия', 'Санитария', 'Оборудование', 'Инвентарь', 'Расходные материалы', 'Системы', 'Бумага', 'Гигиена'];

    // Fetch Catalog Data
    const fetchCatalog = useCallback(async () => {
        if (activeTab !== 'catalog') return;

        try {
            setIsLoading(true);
            const result = await inventoryService.getGlobalItems({
                page,
                pageSize,
                search: searchQuery,
                supplierId: selectedSupplier === 'all' ? undefined : selectedSupplier,
                category: selectedCategory === 'all' ? undefined : selectedCategory
            });

            setCatalogItems(result.data);
            setTotalItems(result.count);
            setTotalPages(result.totalPages);
        } catch {
            toast.error('Ошибка загрузки каталога');
        } finally {
            setIsLoading(false);
        }
    }, [inventoryService, activeTab, page, pageSize, searchQuery, selectedSupplier, selectedCategory]);

    // Initial Load (Suppliers)
    useEffect(() => {
        const loadSuppliers = async () => {
            try {
                const sData = await supplierService.getSuppliers();
                setSuppliers(sData);
            } catch {
                logger.error('Failed to load suppliers');
            }
        };
        loadSuppliers();
    }, [supplierService]);

    // Catalog Sync
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCatalog();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchCatalog]);

    // Summary calculation based on approved projects (Local Logic)
    const procurementData = useMemo(() => {
        const filteredCalcs = calculations.filter(c => {
            if (c.status !== 'invoice') return false;
            if (selectedVenue === 'all') return true;
            const venue = venues.find(v => v.id === selectedVenue);
            return c.organizationName === venue?.name;
        });

        const aggregated = filteredCalcs
            .flatMap(c => c.results?.summary || [])
            .reduce((acc, item) => {
                const key = `${item.inventory}-${item.color}-${item.supplier_id || 'no-supplier'}`;
                if (!acc[key]) {
                    acc[key] = { ...item, quantity: 0, total: 0 };
                }
                acc[key].quantity += item.quantity;
                acc[key].total += (item.quantity * item.price);
                return acc;
            }, {} as Record<string, InventoryItem>);

        return Object.values(aggregated).filter(item =>
            item.inventory.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [calculations, selectedVenue, venues, searchQuery]);

    const totalBudget = useMemo(() =>
        procurementData.reduce((sum, item) => sum + item.total, 0), [procurementData]
    );

    const handlePageChange = (p: number) => {
        if (p >= 1 && p <= totalPages) {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Tabs & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex p-1 bg-card border border-border-theme rounded-full w-fit max-w-full overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => { setActiveTab('procurement'); setPage(1); setSearchQuery(''); }}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'procurement' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingCart size={14} /> Сводный отчет
                            </span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('catalog'); setPage(1); setSearchQuery(''); }}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'catalog' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <span className="flex items-center gap-2">
                                <Package size={14} /> Справочник
                            </span>
                        </button>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                            {activeTab === 'procurement' ? 'Закупки и снабжение' : 'Справочник инвентаря'}
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 border-l-2 border-primary pl-4">
                            {activeTab === 'procurement'
                                ? 'Автоматический расчет объема заказа по всем объектам'
                                : 'Нормативы и спецификации всех позиций'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {activeTab === 'procurement' && (
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                            <select
                                value={selectedVenue}
                                onChange={(e) => setSelectedVenue(e.target.value)}
                                className="bg-card border border-border-theme rounded-2xl pl-12 pr-6 py-3 text-[11px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">Все объекты сети</option>
                                {venues.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {activeTab === 'catalog' && (
                        <button
                            onClick={() => { setPage(1); fetchCatalog(); }}
                            className="flex items-center gap-3 px-6 py-3 bg-card border border-border-theme rounded-2xl hover:text-primary transition-all group"
                        >
                            <RefreshCw size={18} className={`${isLoading ? 'animate-spin' : ''} transition-transform group-hover:rotate-180`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Обновить</span>
                        </button>
                    )}
                    <button className="p-3 bg-card border border-border-theme rounded-2xl text-foreground/40 hover:text-primary transition-all">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* Filters Bar for Catalog Tab */}
            {activeTab === 'catalog' && (
                <div className="glass-card p-6 border-primary/10 shadow-xl space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-6 relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
                            <input
                                type="text"
                                placeholder="Поиск в справочнике..."
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                                className="w-full bg-background/50 border border-border-theme rounded-2xl pl-16 pr-8 py-4 text-[13px] font-black outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <div className="lg:col-span-3 relative">
                            <Building className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                            <select
                                value={selectedSupplier}
                                onChange={e => { setSelectedSupplier(e.target.value); setPage(1); }}
                                className="w-full bg-background/50 border border-border-theme rounded-2xl pl-12 pr-4 py-4 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:border-primary transition-all cursor-pointer"
                            >
                                <option value="all">Все поставщики</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:col-span-3 relative">
                            <Layers className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                            <select
                                value={selectedCategory}
                                onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
                                className="w-full bg-background/50 border border-border-theme rounded-2xl pl-12 pr-4 py-4 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:border-primary transition-all cursor-pointer"
                            >
                                <option value="all">Все категории</option>
                                {categories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'procurement' ? (
                <div className="space-y-8">
                    {/* Procurement Summary (Calculated from project results) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {canSeePrices ? (
                            <div className="glass-card !bg-foreground !text-background p-8 flex flex-col justify-between overflow-hidden relative shadow-2xl">
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Общий бюджет закупки</p>
                                    <h3 className="text-4xl font-black tracking-tighter">{totalBudget.toLocaleString()} ₽</h3>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                            </div>
                        ) : (
                            <div className="glass-card !bg-primary !text-white p-8 flex flex-col justify-between overflow-hidden relative shadow-2xl">
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Расчетный объем</p>
                                    <h3 className="text-4xl font-black tracking-tighter">{procurementData.reduce((s, i) => s + i.quantity, 0)} <span className="text-sm opacity-50">ЕД.</span></h3>
                                </div>
                                <Package className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
                            </div>
                        )}
                        <div className="glass-card p-8 flex flex-col justify-between group shadow-xl">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em]">Позиций к заказу</p>
                                <h3 className="text-4xl font-black tracking-tighter">{procurementData.length}</h3>
                            </div>
                        </div>
                        <div className="glass-card p-8 flex items-center gap-6 bg-emerald-500/5 border-emerald-500/10 shadow-xl">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 size={28} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Статус данных</p>
                                <p className="text-[12px] font-black uppercase">Учтены 100% утвержденных смет</p>
                            </div>
                        </div>
                    </div>

                    {/* Procurement Table */}
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
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Наименование позиции</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Поставщик</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Маркировка</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Количество</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Сумма</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-theme">
                                    {procurementData.length > 0 ? procurementData.map((item, i) => (
                                        <tr key={i} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <p className="text-[14px] font-black tracking-tight">{item.inventory}</p>
                                                    {canSeePrices && <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">Цена за ед: {item.price.toLocaleString()} ₽</p>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">
                                                        {(suppliers.find(s => s.id === item.supplier_id)?.name || 'N')[0]}
                                                    </div>
                                                    <span className="text-[12px] font-black uppercase tracking-tight">
                                                        {suppliers.find(s => s.id === item.supplier_id)?.name || 'Не указан'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl shadow-inner border border-border-theme" style={{ backgroundColor: item.color }} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground/60">{item.color}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-black text-lg">
                                                {item.quantity} <span className="text-[10px] text-foreground/20">ШТ.</span>
                                            </td>
                                            {canSeePrices && (
                                                <td className="px-8 py-6 text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <p className="text-lg font-black tracking-tight">{item.total.toLocaleString()} ₽</p>
                                                        <ArrowUpRight size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={canSeePrices ? 5 : 4} className="px-8 py-40 text-center">
                                                <div className="space-y-4">
                                                    <div className="w-20 h-20 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto text-primary/20">
                                                        <Search size={40} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/40">Нет данных для закупки</p>
                                                        <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-[0.2em] mt-2 max-w-xs mx-auto">Убедитесь, что у вас есть утвержденные проекты на этапе выставления счета</p>
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
            ) : (
                <div className="space-y-8">
                    {/* Catalog Directory (From global inventory) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {isLoading ? (
                            Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="glass-card p-8 h-[400px] animate-pulse">
                                    <div className="w-16 h-16 bg-foreground/5 rounded-2xl mb-8" />
                                    <div className="h-6 bg-foreground/5 rounded-full w-3/4 mb-4" />
                                    <div className="h-4 bg-foreground/5 rounded-full w-1/2" />
                                </div>
                            ))
                        ) : (
                            <>
                                {catalogItems.length > 0 ? catalogItems.map((item) => (
                                    <div key={item.id} className="glass-card p-8 flex flex-col justify-between group hover:border-primary/40 transition-all duration-500 relative overflow-hidden shadow-xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/10 transition-colors" />

                                        <div className="space-y-8 relative z-10">
                                            <div className="flex items-start justify-between">
                                                <div className="p-4 rounded-2xl bg-primary/5 text-primary group-hover:scale-110 transition-transform duration-500 shadow-sm border border-primary/5">
                                                    <Package size={24} />
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {canSeePrices && (
                                                        <div className="bg-foreground text-background px-5 py-2.5 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-foreground/10 group-hover:bg-primary transition-colors">
                                                            {item.price.toLocaleString()} ₽
                                                        </div>
                                                    )}
                                                    <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest mt-2 px-3 py-1 bg-background border border-border-theme rounded-lg">
                                                        {item.sku}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-60">
                                                        {item.category || 'Общий инвентарь'}
                                                    </p>
                                                    <h3 className="text-xl font-black uppercase tracking-tight leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                                                        {item.name}
                                                    </h3>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="flex items-center gap-2 bg-background border border-border-theme px-3 py-2 rounded-xl">
                                                        <div className="w-3 h-3 rounded-full shadow-inner border border-white/20" style={{ backgroundColor: item.color }} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Зона</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-background border border-border-theme px-3 py-2 rounded-xl">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Склад:</span>
                                                        <span className={`text-[10px] font-black ${item.stock < 10 ? 'text-red-500' : 'text-emerald-500'}`}>{item.stock} шт</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border-theme space-y-4 relative z-10">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary shadow-inner">
                                                        <Building size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">Поставщик</p>
                                                        <p className="text-[11px] font-black uppercase tracking-tight truncate max-w-[120px]">
                                                            {suppliers.find(s => s.id === item.supplier_id)?.name || 'Внешний вендор'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1 text-primary">
                                                        <Star size={12} fill="currentColor" />
                                                        <span className="text-[12px] font-black">
                                                            {suppliers.find(s => s.id === item.supplier_id)?.rating || '5.0'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">Рейтинг</p>
                                                </div>
                                            </div>

                                            <button className="w-full py-4 rounded-2xl bg-background border border-border-theme text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background hover:border-foreground transition-all flex items-center justify-center gap-2 group/btn shadow-sm">
                                                <Info size={16} className="group-hover/btn:rotate-12 transition-transform" />
                                                Характеристики
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-40 text-center bg-card rounded-[2.5rem] border-2 border-dashed border-border-theme flex flex-col items-center justify-center gap-6">
                                        <Package size={64} className="opacity-5" />
                                        <div className="space-y-2">
                                            <p className="text-[12px] font-black text-foreground/30 uppercase tracking-[0.3em]">Каталог пуст или ничего не найдено</p>
                                            <p className="text-[10px] font-bold text-foreground/10 uppercase tracking-widest">Попробуйте изменить параметры поиска или фильтрации</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="p-8 bg-card border border-border-theme rounded-[2rem] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                Страница <span className="text-primary">{page}</span> из {totalPages}
                                <span className="mx-4 opacity-50">•</span>
                                Всего {totalItems} позиций
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1 || isLoading}
                                    className="w-12 h-12 flex items-center justify-center bg-background border border-border-theme rounded-xl hover:text-primary disabled:opacity-30 disabled:hover:text-foreground transition-all active:scale-90"
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
                                                className={`w-12 h-12 rounded-xl text-[11px] font-black transition-all ${page === pageNum ? 'bg-primary text-white shadow-lg' : 'hover:bg-primary/5 hover:border-primary/30 border border-transparent'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages || isLoading}
                                    className="w-12 h-12 flex items-center justify-center bg-background border border-border-theme rounded-xl hover:text-primary disabled:opacity-30 disabled:hover:text-foreground transition-all active:scale-90"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
