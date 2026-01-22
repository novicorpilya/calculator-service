import React from 'react';
import { Package, Building, Star, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { type InventoryItemMaster } from '@/services/inventory.service';
import { type Supplier } from '../../../dashboard.types';

interface CatalogDirectoryProps {
    items: InventoryItemMaster[];
    isLoading: boolean;
    canSeePrices: boolean;
    suppliers: Supplier[];
    page: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (p: number) => void;
}

export const CatalogDirectory: React.FC<CatalogDirectoryProps> = ({
    items,
    isLoading,
    canSeePrices,
    suppliers,
    page,
    totalPages,
    totalItems,
    onPageChange,
}) => {
    return (
        <div className="space-y-8">
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
                        {items.length > 0 ? (
                            items.map((item) => (
                                <div
                                    key={item.id}
                                    className="glass-card p-8 flex flex-col justify-between group hover:border-primary/40 transition-all duration-500 relative overflow-hidden shadow-xl"
                                >
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
                                                <p className="text-[9px] font-bold text-foreground/50 uppercase tracking-widest mt-2 px-3 py-1 bg-background border border-border-theme rounded-lg">
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
                                                    <div
                                                        className="w-3 h-3 rounded-full shadow-inner border border-white/20"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                                        Зона
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 bg-background border border-border-theme px-3 py-2 rounded-xl">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                                                        Склад:
                                                    </span>
                                                    <span
                                                        className={`text-[10px] font-black ${item.stock < 10 ? 'text-red-500' : 'text-emerald-500'}`}
                                                    >
                                                        {item.stock} шт
                                                    </span>
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
                                                    <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">
                                                        Поставщик
                                                    </p>
                                                    <p className="text-[11px] font-black uppercase tracking-tight truncate max-w-[120px]">
                                                        {suppliers.find(
                                                            (s) => s.id === item.supplier_id
                                                        )?.name || 'Внешний вендор'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1 text-primary">
                                                    <Star size={12} fill="currentColor" />
                                                    <span className="text-[12px] font-black">
                                                        {suppliers.find(
                                                            (s) => s.id === item.supplier_id
                                                        )?.rating || '5.0'}
                                                    </span>
                                                </div>
                                                <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">
                                                    Рейтинг
                                                </p>
                                            </div>
                                        </div>

                                        <button className="w-full py-4 rounded-2xl bg-background border border-border-theme text-[10px] font-black uppercase tracking-widest hover:bg-foreground hover:text-background hover:border-foreground transition-all flex items-center justify-center gap-2 group/btn shadow-sm">
                                            <Info
                                                size={16}
                                                className="group-hover/btn:rotate-12 transition-transform"
                                            />
                                            Характеристики
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-40 text-center bg-card rounded-[2.5rem] border-2 border-dashed border-border-theme flex flex-col items-center justify-center gap-6">
                                <Package size={64} className="opacity-5" />
                                <div className="space-y-2">
                                    <p className="text-[12px] font-black text-foreground/50 uppercase tracking-[0.3em]">
                                        Каталог пуст или ничего не найдено
                                    </p>
                                    <p className="text-[10px] font-bold text-foreground/10 uppercase tracking-widest">
                                        Попробуйте изменить параметры поиска или фильтрации
                                    </p>
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
                            onClick={() => onPageChange(page - 1)}
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
                                        onClick={() => onPageChange(pageNum)}
                                        className={`w-12 h-12 rounded-xl text-[11px] font-black transition-all ${page === pageNum ? 'bg-primary text-white shadow-lg' : 'hover:bg-primary/5 hover:border-primary/30 border border-transparent'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages || isLoading}
                            className="w-12 h-12 flex items-center justify-center bg-background border border-border-theme rounded-xl hover:text-primary disabled:opacity-30 disabled:hover:text-foreground transition-all active:scale-90"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
