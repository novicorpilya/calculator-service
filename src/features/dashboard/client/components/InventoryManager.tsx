import React from 'react';
import {
    Package,
    ShoppingCart,
    Filter,
    Download,
    Search,
    RefreshCw,
    Building,
    Layers,
} from 'lucide-react';
import { type Calculation } from '../../dashboard.types';
import { type Venue } from '@/services/venue.service';
import { useAuth } from '@/features/auth/index';

import { useInventoryManager } from './inventory/useInventoryManager';
import { ProcurementSummary } from './inventory/ProcurementSummary';
import { CatalogDirectory } from './inventory/CatalogDirectory';

interface InventoryManagerProps {
    calculations: Calculation[];
    venues: Venue[];
}

/**
 * Inventory management hub for clients.
 * Refactored into modular components and a custom hook.
 */
export const InventoryManager = React.memo<InventoryManagerProps>(({ calculations, venues }) => {
    const { user } = useAuth();
    const canSeePrices = user?.role === 'manager' || user?.role === 'admin';

    const {
        activeTab,
        setActiveTab,
        catalogItems,
        totalItems,
        totalPages,
        page,
        setPage,
        suppliers,
        isLoading,
        searchQuery,
        setSearchQuery,
        selectedVenue,
        setSelectedVenue,
        selectedSupplier,
        setSelectedSupplier,
        selectedCategory,
        setSelectedCategory,
        categories,
        procurementData,
        totalBudget,
        handlePageChange,
        fetchCatalog,
    } = useInventoryManager({ calculations, venues });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Tabs & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex p-1 bg-card border border-border-theme rounded-full w-fit max-w-full overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => {
                                setActiveTab('procurement');
                                setPage(1);
                                setSearchQuery('');
                            }}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'procurement' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <span className="flex items-center gap-2">
                                <ShoppingCart size={14} /> Сводный отчет
                            </span>
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('catalog');
                                setPage(1);
                                setSearchQuery('');
                            }}
                            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'catalog' ? 'bg-primary text-white shadow-lg' : 'text-foreground/40 hover:text-primary'}`}
                        >
                            <span className="flex items-center gap-2">
                                <Package size={14} /> Справочник
                            </span>
                        </button>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                            {activeTab === 'procurement'
                                ? 'Закупки и снабжение'
                                : 'Справочник инвентаря'}
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
                                {venues.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        {v.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {activeTab === 'catalog' && (
                        <button
                            onClick={() => {
                                setPage(1);
                                fetchCatalog();
                            }}
                            className="flex items-center gap-3 px-6 py-3 bg-card border border-border-theme rounded-2xl hover:text-primary transition-all group"
                        >
                            <RefreshCw
                                size={18}
                                className={`${isLoading ? 'animate-spin' : ''} transition-transform group-hover:rotate-180`}
                            />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                Обновить
                            </span>
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
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full bg-background/50 border border-border-theme rounded-2xl pl-16 pr-8 py-4 text-[13px] font-black outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <div className="lg:col-span-3 relative">
                            <Building className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                            <select
                                value={selectedSupplier}
                                onChange={(e) => {
                                    setSelectedSupplier(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full bg-background/50 border border-border-theme rounded-2xl pl-12 pr-4 py-4 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:border-primary transition-all cursor-pointer"
                            >
                                <option value="all">Все поставщики</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="lg:col-span-3 relative">
                            <Layers className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full bg-background/50 border border-border-theme rounded-2xl pl-12 pr-4 py-4 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:border-primary transition-all cursor-pointer"
                            >
                                <option value="all">Все категории</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'procurement' ? (
                <ProcurementSummary
                    procurementData={procurementData}
                    totalBudget={totalBudget}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    canSeePrices={canSeePrices}
                    suppliers={suppliers}
                />
            ) : (
                <CatalogDirectory
                    items={catalogItems}
                    isLoading={isLoading}
                    canSeePrices={canSeePrices}
                    suppliers={suppliers}
                    page={page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
});
