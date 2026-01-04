import React, { useState, useMemo } from 'react';
import {
    Package,
    ShoppingCart,
    Filter,
    Download,
    Search,
    ArrowUpRight,
    CheckCircle2,
    Info,
    DollarSign,
    Building,
    Star
} from 'lucide-react';
import { type Calculation, type InventoryItem, type Supplier } from '../../dashboard.types';
import { type Venue } from '@/services/venue.service';
import { type InventoryItemMaster, inventoryService } from '@/services/inventory.service';
import { supplierService } from '@/services/supplier.service';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';

interface InventoryManagerProps {
    calculations: Calculation[];
    venues: Venue[];
}

/**
 * Inventory management hub for clients.
 * Handles procurement summaries, catalog browsing, and filtering by venue/supplier.
 */
export const InventoryManager = React.memo<InventoryManagerProps>(({ calculations, venues }) => {
    const [activeTab, setActiveTab] = useState<'procurement' | 'catalog'>('procurement');
    const [selectedVenue, setSelectedVenue] = useState<string>('all');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [globalInventory, setGlobalInventory] = useState<InventoryItemMaster[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const { user } = useAuth();
    const canSeePrices = user?.role === 'manager' || user?.role === 'admin';

    React.useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsLoadingData(true);
                const [suppliersData, catalogData] = await Promise.all([
                    supplierService.getSuppliers(),
                    inventoryService.getGlobalItems()
                ]);
                setSuppliers(suppliersData);
                setGlobalInventory(catalogData);
            } catch (error) {
                toast.error('Ошибка загрузки данных');
            } finally {
                setIsLoadingData(false);
            }
        };
        loadInitialData();
    }, []);

    // Summary calculation based on approved projects
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

    const filteredCatalog = useMemo(() => {
        return globalInventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSupplier = selectedSupplier === 'all' || item.supplier_id === selectedSupplier;
            return matchesSearch && matchesSupplier;
        });
    }, [globalInventory, searchQuery, selectedSupplier]);

    const totalBudget = useMemo(() =>
        procurementData.reduce((sum, item) => sum + item.total, 0), [procurementData]
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Tabs & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex p-1 bg-card border border-border-theme rounded-full w-fit max-w-full overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('procurement')}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'procurement' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingCart size={14} /> Сводный отчет
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('catalog')}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'catalog' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <span className="flex items-center gap-2">
                                <Package size={14} /> Справочник
                            </span>
                        </button>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                            {activeTab === 'procurement' ? 'Закупки и снабжение' : 'Каталог инвентаря'}
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
                    <button className="p-3 bg-card border border-border-theme rounded-2xl text-foreground/40 hover:text-primary transition-all">
                        <Download size={20} />
                    </button>
                </div>
            </div>

            {/* Supplier Selector for Catalog Tab */}
            {activeTab === 'catalog' && (
                <div className="flex flex-wrap gap-4 items-center">
                    <button
                        onClick={() => setSelectedSupplier('all')}
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all ${selectedSupplier === 'all' ? 'bg-foreground border-foreground text-background shadow-xl' : 'bg-card border-transparent text-foreground/40 hover:border-border-theme'}`}
                    >
                        <Building size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Все поставщики</span>
                    </button>
                    {suppliers.map(sup => (
                        <button
                            key={sup.id}
                            onClick={() => setSelectedSupplier(sup.id)}
                            className={`flex items-center gap-4 px-6 py-4 rounded-2xl border-2 transition-all ${selectedSupplier === sup.id ? 'bg-primary border-primary text-white shadow-xl' : 'bg-card border-transparent hover:border-border-theme'}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black text-xs">
                                {sup.name[0]}
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none">{sup.name}</p>
                                <div className="flex items-center gap-1 mt-1 opacity-60">
                                    <Star size={8} className="fill-current" />
                                    <span className="text-[8px] font-bold">{sup.rating}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {activeTab === 'procurement' ? (
                <div className="space-y-8">
                    {/* Summary Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {canSeePrices ? (
                            <div className="glass-card !bg-foreground !text-background p-8 flex flex-col justify-between overflow-hidden relative">
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Общий бюджет закупки</p>
                                    <h3 className="text-4xl font-black tracking-tighter">{totalBudget.toLocaleString()} ₽</h3>
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                                <DollarSign className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
                            </div>
                        ) : (
                            <div className="glass-card !bg-primary !text-white p-8 flex flex-col justify-between overflow-hidden relative">
                                <div className="space-y-2 relative z-10">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Расчетный объем</p>
                                    <h3 className="text-4xl font-black tracking-tighter">{procurementData.reduce((s, i) => s + i.quantity, 0)} <span className="text-sm opacity-50">ЕД.</span></h3>
                                </div>
                                <Package className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10" />
                            </div>
                        )}
                        <div className="glass-card p-8 flex flex-col justify-between group">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.3em]">Позиций к заказу</p>
                                <h3 className="text-4xl font-black tracking-tighter">{procurementData.length}</h3>
                            </div>
                        </div>
                        <div className="glass-card p-8 flex items-center gap-6 bg-emerald-500/5 border-emerald-500/10">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 size={28} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Статус данных</p>
                                <p className="text-[12px] font-black uppercase">Учтены 100% утвержденных смет</p>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-xl">
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
                                    <tr className="border-b border-border-theme">
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Наименование позиции</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Поставщик</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Маркировка</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Количество</th>
                                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Сумма</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {procurementData.length > 0 ? procurementData.map((item, i) => (
                                        <tr key={i} className="border-b border-border-theme hover:bg-primary/5 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="space-y-1">
                                                    <p className="text-[14px] font-black tracking-tight">{item.inventory}</p>
                                                    {canSeePrices && <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">Цена за ед: {item.price.toLocaleString()} ₽</p>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black">
                                                        {(suppliers.find(s => s.id === item.supplier_id)?.name || 'N')[0]}
                                                    </div>
                                                    <span className="text-[11px] font-black uppercase tracking-tight">
                                                        {suppliers.find(s => s.id === item.supplier_id)?.name || 'Не указан'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg shadow-inner" style={{ backgroundColor: item.color }} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60">{item.color}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-black text-lg">
                                                {item.quantity} <span className="text-[10px] text-foreground/20">ШТ.</span>
                                            </td>
                                            {canSeePrices && (
                                                <td className="px-8 py-6 text-right">
                                                    <p className="text-lg font-black tracking-tight">{item.total.toLocaleString()} ₽</p>
                                                    <ArrowUpRight size={14} className="inline ml-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </td>
                                            )}
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={canSeePrices ? 5 : 4} className="px-8 py-20 text-center">
                                                <div className="space-y-4">
                                                    <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto text-primary/20">
                                                        <Search size={32} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-foreground/40">Нет данных для закупки</p>
                                                        <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-[0.2em] mt-1">Убедитесь, что у вас есть проекты в статусе выставленного счета (Invoiced)</p>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {isLoadingData ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                        </div>
                    ) : (
                        <>
                            <div className="col-span-full flex items-center justify-between bg-card border border-border-theme p-6 rounded-[2rem] mb-4">
                                <div className="relative flex-1 max-w-lg">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Поиск в каталоге..."
                                        className="w-full bg-background/50 border border-border-theme rounded-2xl pl-16 pr-8 py-4 text-[13px] font-black outline-none focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">Всего позиций</p>
                                    <p className="text-2xl font-black">{filteredCatalog.length}</p>
                                </div>
                            </div>
                            {filteredCatalog.length > 0 ? filteredCatalog.map((item) => (
                                <div key={item.id} className="glass-card p-8 flex flex-col justify-between group hover:border-primary/40 transition-all duration-500 relative overflow-hidden">
                                    {/* Decor gradient */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-primary/10 transition-colors" />

                                    <div className="space-y-8 relative z-10">
                                        <div className="flex items-start justify-between">
                                            <div className="p-4 rounded-2xl bg-primary/5 text-primary group-hover:scale-110 transition-transform duration-500">
                                                <Package size={24} />
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                {canSeePrices && (
                                                    <div className="bg-foreground text-background px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-foreground/10">
                                                        {item.price.toLocaleString()} ₽
                                                    </div>
                                                )}
                                                <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">Арт: {item.sku}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest opacity-60">
                                                    {item.category || 'Общий инвентарь'}
                                                </p>
                                                <h3 className="text-xl font-black uppercase tracking-tight leading-tight line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                                                    {item.name}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-card border border-border-theme px-3 py-2 rounded-xl">
                                                    <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: item.color }} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Цвет</span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-card border border-border-theme px-3 py-2 rounded-xl">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">На складе:</span>
                                                    <span className="text-[10px] font-black text-emerald-500">{item.stock} шт</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-border-theme space-y-4 relative z-10">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground/40 group-hover:text-primary transition-colors">
                                                    <Building size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">Поставщик</p>
                                                    <p className="text-[11px] font-black uppercase tracking-tight">
                                                        {suppliers.find(s => s.id === item.supplier_id)?.name || 'Не указан'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-primary">
                                                <Star size={12} fill="currentColor" />
                                                <span className="text-[10px] font-black">
                                                    {suppliers.find(s => s.id === item.supplier_id)?.rating || '5.0'}
                                                </span>
                                            </div>
                                        </div>

                                        <button className="w-full py-4 rounded-2xl bg-card border border-border-theme text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background hover:border-foreground transition-all flex items-center justify-center gap-2 group/btn">
                                            <Info size={14} className="group-hover/btn:rotate-12 transition-transform" />
                                            Подробности и ТТХ
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-20 text-center bg-card rounded-[2rem] border-2 border-dashed border-border-theme">
                                    <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">В каталоге этого поставщика пока нет позиций</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
});
