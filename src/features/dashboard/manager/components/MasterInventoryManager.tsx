import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Save,
    X,
    Info,
    DollarSign,
    Layout,
    Users,
    Maximize2,
    RefreshCw,
    Package
} from 'lucide-react';
import { inventoryService, type InventoryItemMaster, type CreateInventoryItemData } from '@/services/inventory.service';
import { toast } from 'sonner';

/**
 * Master inventory control center for managers.
 * Provides tools to manage global product norms and pricing.
 */
export const MasterInventoryManager = React.memo(() => {
    const [items, setItems] = useState<InventoryItemMaster[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItemMaster | null>(null);
    const [formData, setFormData] = useState<CreateInventoryItemData>({
        name: '',
        color: '#3b82f6',
        price: 0,
        norm_area: 0,
        norm_personnel: 0,
        norm_intensity: 0,
        category: 'cleaning'
    });

    const fetchItems = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await inventoryService.getGlobalItems();
            setItems(data);
        } catch (error) {
            toast.error('Ошибка при загрузке каталога');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const promise = inventoryService.upsertItem(
                editingItem ? { ...formData, id: editingItem.id } : { ...formData, name: formData.name }
            );

            toast.promise(promise, {
                loading: 'Сохранение...',
                success: () => {
                    fetchItems();
                    setIsModalOpen(false);
                    return editingItem ? 'Позиция обновлена' : 'Позиция добавлена в каталог';
                },
                error: 'Ошибка при сохранении'
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены? Это может повлиять на новые расчеты клиентов.')) return;
        try {
            await inventoryService.deleteItem(id);
            toast.success('Позиция удалена');
            fetchItems();
        } catch (error) {
            toast.error('Ошибка при удалении');
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">Управление базой знаний</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-l-2 border-primary pl-4">
                        Глобальный каталог нормативов и цен инвентаря
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchItems}
                        className="p-4 bg-card border border-border-theme rounded-2xl hover:text-primary transition-all"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setFormData({
                                name: '',
                                color: '#3b82f6',
                                price: 0,
                                norm_area: 0,
                                norm_personnel: 0,
                                norm_intensity: 0,
                                category: 'cleaning'
                            });
                            setIsModalOpen(true);
                        }}
                        className="btn-premium flex items-center gap-3 px-8"
                    >
                        <Plus size={18} />
                        <span className="text-[11px] font-black uppercase tracking-widest">Добавить товар</span>
                    </button>
                </div>
            </div>

            {/* Stats / Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex flex-col justify-between">
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-4">Всего позиций</p>
                    <h4 className="text-3xl font-black">{items.length}</h4>
                </div>
                <div className="glass-card p-6 flex items-center gap-4 bg-primary/5 border-primary/10">
                    <div className="p-3 bg-primary text-white rounded-xl">
                        <Info size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-foreground/60 leading-relaxed uppercase tracking-wider">
                        Настройте нормы для авто-расчета. Эти данные — фундамент экспертности сервиса.
                    </p>
                </div>
                <div className="glass-card p-6 flex flex-col justify-between">
                    <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-4">Обновлено</p>
                    <h4 className="text-[12px] font-black uppercase">{new Date().toLocaleDateString('ru-RU')}</h4>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-card border border-border-theme rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-border-theme">
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/20" />
                        <input
                            type="text"
                            placeholder="Поиск по названию или категории..."
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
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Товар / Маркировка</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-center">Цена</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40">Нормативы расхода</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-foreground/40 text-right">Управление</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && items.length === 0 ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="h-24 px-8 border-b border-border-theme">
                                            <div className="h-8 bg-foreground/5 rounded-xl w-3/4" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredItems.map((item) => (
                                <tr key={item.id} className="border-b border-border-theme hover:bg-primary/5 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-primary bg-primary/10 relative overflow-hidden">
                                                <Package size={20} />
                                                <div className="absolute bottom-0 left-0 w-full h-1" style={{ backgroundColor: item.color }} />
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-black tracking-tight mb-0.5">{item.name}</p>
                                                <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">
                                                    HEX: {item.color}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl">
                                            <DollarSign size={14} className="text-primary" />
                                            <span className="text-[13px] font-black tracking-tight">{item.price.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex gap-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                                                    <Maximize2 size={12} /> {item.norm_area}
                                                </div>
                                                <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">на 100м²</p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest">
                                                    <Users size={12} /> {item.norm_personnel}
                                                </div>
                                                <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">на 1 чел</p>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-orange-500 uppercase tracking-widest">
                                                    <RefreshCw size={12} /> {item.norm_intensity}
                                                </div>
                                                <p className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">на 100 пос.</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item);
                                                    setFormData({
                                                        name: item.name,
                                                        color: item.color,
                                                        price: item.price,
                                                        norm_area: item.norm_area,
                                                        norm_personnel: item.norm_personnel,
                                                        norm_intensity: item.norm_intensity,
                                                        category: item.category || 'cleaning'
                                                    });
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-3 hover:bg-primary/10 rounded-xl text-foreground/30 hover:text-primary transition-all"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-3 hover:bg-red-500/10 rounded-xl text-foreground/30 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-card border border-border-theme rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black uppercase tracking-tight">
                                {editingItem ? 'Редактировать позицию' : 'Новое оборудование'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-primary/5 rounded-xl transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Наименование</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="input-premium py-4"
                                        placeholder="Напр. Швабра профессиональная"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Маркировка (Цвет)</label>
                                    <div className="flex gap-4 items-center">
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                                            className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={formData.color}
                                            onChange={e => setFormData({ ...formData, color: e.target.value })}
                                            className="flex-1 input-premium py-3 text-center"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-foreground/40 uppercase tracking-widest ml-1">Цена за единицу (₽)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="input-premium py-4"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Layout size={18} className="text-primary" />
                                    <h3 className="text-[11px] font-black uppercase tracking-widest">Нормативы расхода</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1 text-center">На 100 м²</p>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.norm_area}
                                            onChange={e => setFormData({ ...formData, norm_area: Number(e.target.value) })}
                                            className="input-premium text-center py-4"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1 text-center">На 1 сотр.</p>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.norm_personnel}
                                            onChange={e => setFormData({ ...formData, norm_personnel: Number(e.target.value) })}
                                            className="input-premium text-center py-4"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-foreground/40 uppercase tracking-widest ml-1 text-center">На 100 пос.</p>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.norm_intensity}
                                            onChange={e => setFormData({ ...formData, norm_intensity: Number(e.target.value) })}
                                            className="input-premium text-center py-4"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="btn-premium w-full py-5 group mt-4">
                                <Save className="w-5 h-5 transition-transform group-hover:scale-110" />
                                <span className="text-[12px] font-black uppercase tracking-widest">
                                    {editingItem ? 'Зафиксировать изменения' : 'Добавить в архив'}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
});
