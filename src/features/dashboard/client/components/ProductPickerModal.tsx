import React, { useState, useMemo } from 'react';
import { Search, X, Package, Check, AlertCircle } from 'lucide-react';
import { type InventoryItemMaster } from '@/services/inventory.service';
import { type InventoryItem } from '../../dashboard.types';

interface ProductPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (masterItem: InventoryItemMaster) => void;
    catalog: InventoryItemMaster[];
    currentItem: InventoryItem;
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
    isOpen,
    onClose,
    onSelect,
    catalog,
    currentItem
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredCatalog = useMemo(() => {
        return catalog.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [catalog, searchQuery]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="glass-card max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-3xl border-primary/20">
                {/* Header */}
                <div className="p-8 border-b border-border-theme flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-2xl font-black tracking-tight uppercase">Выбор продукта</h3>
                        <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">
                            Замена для: <span className="text-primary">{currentItem.inventory}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-card border border-border-theme rounded-xl hover:text-primary transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-8 bg-primary/5">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
                        <input
                            type="text"
                            autoFocus
                            placeholder="Поиск по каталогу (название или SKU)..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-background border border-border-theme rounded-2xl pl-16 pr-8 py-4 text-[13px] font-black outline-none focus:border-primary transition-all shadow-inner"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                    {filteredCatalog.length > 0 ? filteredCatalog.map((item) => {
                        const isCurrent = item.sku === currentItem.sku;
                        return (
                            <div
                                key={item.id}
                                onClick={() => onSelect(item)}
                                className={`group relative p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 ${isCurrent
                                        ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
                                        : 'bg-card border-transparent hover:border-border-theme hover:bg-primary/5'
                                    }`}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-primary bg-primary/10 group-hover:scale-110 transition-transform duration-500 shrink-0">
                                        <Package size={24} />
                                        <div className="absolute bottom-4 left-6 w-8 h-1" style={{ backgroundColor: item.color }} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[15px] font-black tracking-tight leading-none group-hover:text-primary transition-colors">{item.name}</p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">SKU: {item.sku}</p>
                                            <div className="w-1 h-1 rounded-full bg-foreground/10" />
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest">{item.price.toLocaleString()} ₽/ед</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">Остаток</p>
                                        <p className={`text-sm font-black ${item.stock < 10 ? 'text-red-500' : 'text-foreground'}`}>{item.stock} шт</p>
                                    </div>
                                    {isCurrent && (
                                        <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 animate-in zoom-in duration-300">
                                            <Check size={20} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-card border border-border-theme rounded-2xl flex items-center justify-center mx-auto opacity-20">
                                <AlertCircle size={32} />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-foreground/40 italic">Товары не найдены в каталоге</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
