import React from 'react';
import { 
    Building2, 
    Search, 
    Plus, 
    Edit2, 
    Trash2, 
    Star,
    Globe,
    Phone,
    Mail,
    MapPin,
    X
} from 'lucide-react';
import { AdminSupplierForm } from './AdminSupplierForm';
import { useSupplierAdmin } from '../hooks/useSupplierAdmin';

const SupplierLogo: React.FC<{ logo?: string | null, name: string, className?: string }> = ({ logo, name, className = "w-16 h-16" }) => {
    if (logo) {
        return (
            <div className={`${className} rounded-2xl overflow-hidden border border-border-theme bg-white p-2 shadow-sm`}>
                <img src={logo} alt={name} className="w-full h-full object-contain" />
            </div>
        );
    }
    return (
        <div className={`${className} rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl border border-primary/20 shadow-sm`}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
};

export const AdminSupplierManager: React.FC = () => {
    const {
        suppliers,
        loading,
        search,
        setSearch,
        isModalOpen,
        setIsModalOpen,
        editingSupplier,
        setEditingSupplier,
        handleDelete,
        refresh
    } = useSupplierAdmin();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header Toolbar */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                           <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-500">
                                <Building2 size={24} />
                           </div>
                           База Поставщиков
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium ml-1">
                            Реестр верифицированных партнеров и поставщиков
                        </p>
                    </div>

                     <button 
                        onClick={() => {
                            setEditingSupplier(undefined);
                            setIsModalOpen(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={16} />
                        Добавить Поставщика
                    </button>
                </div>

                <div className="relative group max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                    <input 
                        type="text"
                        placeholder="Поиск по названию или категории..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-card/50 border border-border-theme hover:border-border-theme/80 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-[1.25rem] pl-12 pr-4 py-4 outline-none transition-all font-medium text-sm"
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-card h-64 rounded-[2.5rem] animate-pulse border border-border-theme" />
                    ))}
                </div>
            ) : suppliers.length === 0 ? (
                <div className="bg-card/50 border-2 border-dashed border-border-theme rounded-[2.5rem] py-32 flex flex-col items-center justify-center gap-6">
                    <div className="p-8 bg-muted/50 rounded-full text-muted-foreground">
                        <Building2 size={64} strokeWidth={1} />
                    </div>
                    <div className="text-center">
                        <h4 className="text-xl font-bold">Список пуст</h4>
                        <p className="text-muted-foreground">Пока не добавлено ни одного поставщика</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {suppliers.map((supplier) => (
                        <div key={supplier.id} className="group relative bg-card border border-border-theme hover:border-primary/20 rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-primary/5">
                            <div className="flex gap-6">
                                <SupplierLogo logo={supplier.logo} name={supplier.name} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-black text-xl leading-none group-hover:text-primary transition-colors">{supplier.name}</h3>
                                        {supplier.rating && (
                                            <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md text-[10px] font-black">
                                                <Star size={10} fill="currentColor" />
                                                {supplier.rating.toFixed(1)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{supplier.description || 'Общий поставщик'}</div>
                                    
                                    <div className="grid grid-cols-2 gap-y-3 mt-6">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Globe size={14} className="text-primary/50" />
                                            <span className="truncate">{supplier.contacts?.website || 'No website'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Phone size={14} className="text-primary/50" />
                                            <span>{supplier.contacts?.phone || 'No phone'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                                            <Mail size={14} className="text-primary/50" />
                                            <span className="truncate">{supplier.contacts?.email || 'No email'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                                            <MapPin size={14} className="text-primary/50" />
                                            <span className="truncate">{supplier.contacts?.address || 'No address'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-8 right-8 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => {
                                        setEditingSupplier(supplier);
                                        setIsModalOpen(true);
                                    }}
                                    className="p-3 bg-muted hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(supplier.id, supplier.name)}
                                    className="p-3 bg-muted hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card border border-border-theme w-full max-w-4xl max-h-[90vh] overflow-auto rounded-[3rem] shadow-2xl p-10 sm:p-14 relative mt-20 md:mt-0">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-8 right-8 p-3 hover:bg-muted rounded-2xl text-muted-foreground transition-all"
                        >
                            <X size={24} />
                        </button>

                        <AdminSupplierForm 
                            initialData={editingSupplier}
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
