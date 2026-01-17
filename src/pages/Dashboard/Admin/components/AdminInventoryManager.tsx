import React from 'react';
import { 
    Library, 
    Search, 
    Plus, 
    Edit2, 
    Trash2, 
    Package,
    ChevronLeft,
    ChevronRight,
    Store
} from 'lucide-react';
import { AdminInventoryForm } from './AdminInventoryForm';
import { useInventoryAdmin } from '../hooks/useInventoryAdmin';

export const AdminInventoryManager: React.FC = () => {
    const pageSize = 12;
    const {
        items,
        total,
        page,
        setPage,
        search,
        setSearch,
        loading,
        isModalOpen,
        setIsModalOpen,
        editingItem,
        setEditingItem,
        handleDelete,
        refresh
    } = useInventoryAdmin(pageSize);
    
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header Stats & Toolbar */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                           <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <Library size={24} />
                           </div>
                           Реестр оборудования
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium ml-1">
                            Управление номенклатурой и нормативами
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-card border border-border-theme px-4 py-2 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 border-r border-border-theme pr-4 mr-1">
                            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
                                <Package size={18} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Всего</span>
                                <span className="text-lg font-black leading-none">{total}</span>
                            </div>
                        </div>
                         <button 
                            onClick={() => {
                                setEditingItem(undefined);
                                setIsModalOpen(true);
                            }}
                            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Plus size={16} />
                            Добавить Товар
                        </button>
                    </div>
                </div>

                <div className="relative group max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                        type="text"
                        placeholder="Поиск по названию, артикулу или бренду..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="w-full bg-card/50 border border-border-theme hover:border-border-theme/80 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-[1.25rem] pl-12 pr-4 py-4 outline-none transition-all font-medium text-sm"
                    />
                </div>
            </div>

            {/* Content List */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-card h-48 rounded-[2rem] animate-pulse border border-border-theme" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <div className="bg-card/50 border-2 border-dashed border-border-theme rounded-[2.5rem] py-32 flex flex-col items-center justify-center gap-6">
                    <div className="p-8 bg-muted/50 rounded-full text-muted-foreground">
                        <Store size={64} strokeWidth={1} />
                    </div>
                    <div className="text-center">
                        <h4 className="text-xl font-bold">Ничего не найдено</h4>
                        <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <div key={item.id} className="group relative bg-card border border-border-theme hover:border-primary/20 rounded-[2rem] p-6 transition-all hover:shadow-2xl hover:shadow-primary/5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-muted rounded-xl text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{item.sku || 'N/A'}</div>
                                            <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">{item.name}</h3>
                                        </div>
                                    </div>
                                    <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                                        {item.price ? `${item.price.toLocaleString()} ₽` : 'Цена не задна'}
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2 mb-6 min-h-[2rem]">
                                    {item.description || 'Описание отсутствует'}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-border-theme">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{item.series || 'No Series'}</div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => {
                                                setEditingItem(item);
                                                setIsModalOpen(true);
                                            }}
                                            className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(item.id, item.name)}
                                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-12 bg-card border border-border-theme w-fit mx-auto p-1.5 rounded-2xl shadow-sm">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-xl hover:bg-muted disabled:opacity-20 transition-all font-bold"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="flex items-center px-4 gap-2">
                                <span className="text-sm font-black text-primary">{page}</span>
                                <span className="text-[10px] font-bold uppercase text-muted-foreground mt-0.5">из {totalPages}</span>
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="p-2 rounded-xl hover:bg-muted disabled:opacity-20 transition-all font-bold"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card border border-border-theme w-full max-w-4xl max-h-[90vh] overflow-auto rounded-[2.5rem] shadow-2xl p-8 sm:p-12 relative">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-8 right-8 p-2 hover:bg-muted rounded-xl text-muted-foreground transition-all"
                        >
                            <Trash2 size={24} className="rotate-45" />
                        </button>

                        <AdminInventoryForm 
                            initialData={editingItem}
                            onSuccess={() => {
                                setIsModalOpen(false);
                                void refresh();
                            }}
                            onClose={() => setIsModalOpen(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
